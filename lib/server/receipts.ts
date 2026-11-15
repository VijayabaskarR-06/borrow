import type { AuditEvent, PrivacyReceipt, Task, VerificationResult } from '../contracts';
import type { WorkspaceState } from './models';
import { canonical, sha256, sign, verify } from './crypto';
import { POLICY_VERSION } from './seed';
import { verifyEventChain } from './policy';
export async function issueReceipt(state:WorkspaceState,task:Task):Promise<PrivacyReceipt>{
  const createdAt=new Date().toISOString();const receiptId=crypto.randomUUID();
  const payload={schema:'borrow.receipt.v1',receiptId,taskId:task.id,leaseId:task.leaseId,workspaceId:state.id,issuedAt:createdAt,policyVersion:POLICY_VERSION,completionStatus:task.status,processor:task.report?.mode==='ai'?'model-assisted':task.report?.mode==='private'?'private-record-reconciliation':'deterministic-demo',reportHash:await sha256(canonical(task.report??null)),allowedResources:[...task.capsule.resourceIds],disclosedFields:[...new Set(state.events.filter(e=>e.taskId===task.id&&e.decision==='ALLOW').flatMap(e=>e.fields??[]))],allowedOperations:state.events.filter(e=>e.taskId===task.id&&e.decision==='ALLOW').length,deniedOperations:state.events.filter(e=>e.taskId===task.id&&e.decision==='DENY').length,events:structuredClone(state.events),auditRoot:state.events.at(-1)?.hash??'GENESIS',anchoring:'Not anchored on-chain'};
  const hash=await sha256(canonical(payload));
  const receipt:PrivacyReceipt={id:receiptId,taskId:task.id,leaseId:task.leaseId!,createdAt,payload,hash,signature:await sign({hash},state.privateKey),publicKey:structuredClone(state.publicKey),algorithm:'ECDSA-P256-SHA256',anchor:'Not anchored on-chain'};
  state.receipts.push(receipt);task.receiptId=receipt.id;return receipt;
}
export async function verifyReceipt(receipt:PrivacyReceipt, trustedPublicKey?:JsonWebKey):Promise<Omit<VerificationResult,'tampered'|'checkedAt'|'message'>> {
  const hashValid=(await sha256(canonical(receipt.payload)))===receipt.hash;
  const keyMatches=!trustedPublicKey || canonical(receipt.publicKey)===canonical(trustedPublicKey);
  const envelopeValid=receipt.id===receipt.payload.receiptId&&receipt.taskId===receipt.payload.taskId&&receipt.leaseId===receipt.payload.leaseId&&receipt.createdAt===receipt.payload.issuedAt&&receipt.algorithm==='ECDSA-P256-SHA256'&&receipt.anchor===receipt.payload.anchoring;
  const signatureValid=envelopeValid&&keyMatches&&await verify({hash:receipt.hash},receipt.signature,trustedPublicKey??receipt.publicKey);
  const events=receipt.payload.events;
  const chainValid=Array.isArray(events)&&await verifyEventChain(events as AuditEvent[])&&receipt.payload.auditRoot===((events as AuditEvent[]).at(-1)?.hash??'GENESIS');
  return {receiptId:receipt.id,valid:hashValid&&signatureValid&&chainValid,hashValid,signatureValid,chainValid};
}
