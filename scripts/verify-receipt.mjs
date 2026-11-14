#!/usr/bin/env node

// Offline verifier for BORROW receipt v1. No application imports, dependencies,
// environment variables, private keys, or network access are used.
import { readFile, stat } from 'node:fs/promises';
import { createHash, webcrypto } from 'node:crypto';
import { pathToFileURL } from 'node:url';

const encoder = new TextEncoder();
const HEX_256 = /^[a-f0-9]{64}$/;

/** BORROW v1 canonical JSON: recursively sort object keys; preserve array order. */
export function canonical(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  return `{${Object.keys(value).filter(key => value[key] !== undefined).sort()
    .map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
}

function sha256(value) {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function record(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function publicKeyCoordinates(value) {
  if (!record(value) || value.kty !== 'EC' || value.crv !== 'P-256'
    || typeof value.x !== 'string' || typeof value.y !== 'string'
    || !/^[A-Za-z0-9_-]{43}$/.test(value.x) || !/^[A-Za-z0-9_-]{43}$/.test(value.y)
    || Object.hasOwn(value, 'd')) {
    throw new Error('Expected a public EC P-256 JWK with x/y coordinates and no private d field.');
  }
  return { crv: 'P-256', kty: 'EC', x: value.x, y: value.y };
}

async function checkChain(events, auditRoot) {
  if (!Array.isArray(events) || typeof auditRoot !== 'string') return false;
  let previous = 'GENESIS';
  for (let index = 0; index < events.length; index++) {
    const event = events[index];
    if (!record(event) || event.sequence !== index + 1
      || event.previousHash !== previous || !HEX_256.test(event.hash)) return false;
    const { hash, ...body } = event;
    if (sha256(canonical(body)) !== hash) return false;
    previous = hash;
  }
  return auditRoot === previous;
}

/** Check the receipt independently. An expected key must be trusted separately. */
export async function verifyReceipt(receipt, expectedPublicKey) {
  if (!record(receipt) || !record(receipt.payload)
    || receipt.payload.schema !== 'borrow.receipt.v1'
    || receipt.algorithm !== 'ECDSA-P256-SHA256'
    || typeof receipt.id !== 'string' || typeof receipt.taskId !== 'string'
    || typeof receipt.leaseId !== 'string' || !HEX_256.test(receipt.hash)
    || typeof receipt.signature !== 'string') {
    throw new Error('Invalid or unsupported BORROW receipt v1 structure.');
  }

  const suppliedKey = publicKeyCoordinates(receipt.publicKey);
  const expectedKey = expectedPublicKey === undefined ? undefined : publicKeyCoordinates(expectedPublicKey);
  const keyMatches = expectedKey === undefined || canonical(suppliedKey) === canonical(expectedKey);
  const keyFingerprint = sha256(canonical(suppliedKey));
  const calculatedHash = sha256(canonical(receipt.payload));
  const hashValid = calculatedHash === receipt.hash;
  const chainValid = await checkChain(receipt.payload.events, receipt.payload.auditRoot);
  // Every displayed envelope identifier must match its signed payload field.
  const envelopeValid = receipt.id === receipt.payload.receiptId
    && receipt.taskId === receipt.payload.taskId
    && receipt.leaseId === receipt.payload.leaseId
    && receipt.createdAt === receipt.payload.issuedAt
    && receipt.anchor === receipt.payload.anchoring;

  let signatureValid = false;
  if (keyMatches && /^[A-Za-z0-9+/]{86}==$/.test(receipt.signature)) {
    try {
      const key = await webcrypto.subtle.importKey('jwk', expectedKey ?? suppliedKey,
        { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
      signatureValid = await webcrypto.subtle.verify(
        { name: 'ECDSA', hash: 'SHA-256' }, key,
        Buffer.from(receipt.signature, 'base64'),
        encoder.encode(canonical({ hash: receipt.hash })),
      );
    } catch {
      signatureValid = false;
    }
  }

  return {
    valid: hashValid && signatureValid && chainValid && envelopeValid && keyMatches,
    hashValid,
    signatureValid,
    chainValid,
    envelopeValid,
    expectedKeyProvided: expectedKey !== undefined,
    expectedKeyMatches: expectedKey === undefined ? null : keyMatches,
    publicKeyFingerprintSha256: keyFingerprint,
    receiptHash: receipt.hash,
    calculatedHash,
    taskId: receipt.payload.taskId,
    eventCount: Array.isArray(receipt.payload.events) ? receipt.payload.events.length : 0,
    anchoring: receipt.payload.anchoring,
  };
}

const HELP = `Usage: node scripts/verify-receipt.mjs <receipt.json> [--expected-key <public-key.json>] [--json]

Checks the canonical payload SHA-256 hash, ECDSA P-256 signature,
audit event hash chain, and signed envelope fields. Entirely offline.

--expected-key  Compare against a public JWK obtained through a trusted channel.
--json          Print machine-readable results instead of the human report.
--help          Show this help.

Exit codes: 0 = checks passed, 1 = verification failed, 2 = invalid input/usage.
Without --expected-key, verification establishes integrity under the included
key, not the identity or trustworthiness of its owner. Neither mode proves
document truth, exhaustive monitoring, or the contents of a separate report.
`;

async function loadJson(file) {
  const details = await stat(file);
  if (!details.isFile() || details.size > 10 * 1024 * 1024) {
    throw new Error('Input must be a regular JSON file of at most 10 MB.');
  }
  return JSON.parse(await readFile(file, 'utf8'));
}

async function main(args) {
  if (args.includes('--help') || args.includes('-h')) { console.log(HELP); return 0; }
  let file, expectedKeyFile, json = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--json') json = true;
    else if (args[i] === '--expected-key') {
      if (expectedKeyFile || !args[i + 1] || args[i + 1].startsWith('--')) throw new Error('--expected-key needs one public JWK filename.');
      expectedKeyFile = args[++i];
    } else if (args[i].startsWith('-') || file) throw new Error('Unexpected argument. Run with --help for usage.');
    else file = args[i];
  }
  if (!file) throw new Error('A receipt JSON filename is required. Run with --help for usage.');
  const receipt = await loadJson(file);
  const key = expectedKeyFile ? await loadJson(expectedKeyFile) : undefined;
  const result = await verifyReceipt(receipt, key);
  if (json) console.log(JSON.stringify(result, null, 2));
  else {
    console.log(result.valid ? 'VERIFIED — receipt integrity checks passed.' : 'REJECTED — receipt verification failed.');
    for (const [label, passed] of [
      ['Canonical payload hash', result.hashValid],
      ['ECDSA P-256 signature', result.signatureValid],
      ['Audit event chain', result.chainValid],
      ['Signed envelope consistency', result.envelopeValid],
    ]) console.log(`  ${passed ? 'PASS' : 'FAIL'}  ${label}`);
    if (result.expectedKeyProvided) console.log(`  ${result.expectedKeyMatches ? 'PASS' : 'FAIL'}  Expected public key`);
    console.log(`Events: ${result.eventCount}`);
    console.log(`Public-key fingerprint (SHA-256): ${result.publicKeyFingerprintSha256}`);
    console.log(`Anchoring: ${result.anchoring}`);
    if (!result.expectedKeyProvided) console.log('Signer identity is unverified: no independently trusted expected key was supplied.');
  }
  return result.valid ? 0 : 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { process.exitCode = await main(process.argv.slice(2)); }
  catch (error) {
    console.error(`Receipt verification error: ${error instanceof Error ? error.message : 'Invalid input.'}`);
    process.exitCode = 2;
  }
}
