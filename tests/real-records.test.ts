import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { handleApi } from '../lib/server/api';
import { verifyReceipt } from '../lib/server/receipts';
import type { WorkspaceSnapshot } from '../lib/contracts';

test('real CSV records produce a scoped reconciliation with duplicate and payment checks', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'borrow-real-'));
  const ctx = { userId: 'real-csv-test', env: { BORROW_DATA_DIR: dir } };
  async function call(action: string, body: object) {
    const response = await handleApi(new Request('http://localhost/api/borrow/' + action, { method: 'POST', body: JSON.stringify(body) }), ctx);
    return { status: response.status, value: await response.json() as WorkspaceSnapshot };
  }
  try {
    const csv = 'type,vendor,invoiceNumber,date,amount,currency,category,description,bankAccount\n' +
      'invoice,Acme,AC-1,2026-11-01,150.00,USD,Software,"Plan, November",PRIVATE-123\n' +
      'invoice,Acme,AC-1,2026-11-01,150.00,USD,Software,Duplicate,PRIVATE-123\n' +
      'invoice,Beta,B-2,2026-11-03,80.00,USD,Travel,Taxi,PRIVATE-456\n' +
      'receipt,Acme,AC-1,2026-11-05,150.00,USD,Payment,Card payment,PRIVATE-123\n';
    let result = await call('upload', { name: 'november.csv', content: csv, mimeType: 'text/csv' });
    assert.equal(result.status, 200);
    const ids = result.value.documents.filter(d => d.id.startsWith('upload-')).map(d => d.id);
    assert.equal(ids.length, 4);
    assert.equal(result.value.mode, 'private');
    const preview = await handleApi(new Request('http://localhost/api/borrow/document?id=' + ids[0]), ctx);
    const imported = await preview.json() as { content: string; fields: Record<string, unknown> };
    assert.equal(imported.fields.description, 'Plan, November');
    assert.ok(!imported.content.includes('PRIVATE-123'));
    result = await call('propose', { prompt: 'Reconcile my expenses', resourceIds: ids });
    assert.equal(result.status, 200);
    const taskId = result.value.activeTaskId!;
    result = await call('approve', { taskId });
    assert.equal(result.status, 200);
    const steps = result.value.tasks.find(t => t.id === taskId)!.totalSteps;
    for (let i = 0; i < steps; i++) result = await call('step', { taskId });
    const task = result.value.tasks.find(t => t.id === taskId)!;
    assert.equal(task.status, 'completed');
    assert.equal(task.report?.total, 230);
    assert.equal(task.report?.period, 'November 2026');
    assert.equal(task.report?.mode, 'private');
    assert.equal(task.report?.checks?.duplicateInvoices.length, 1);
    assert.equal(task.report?.checks?.withoutPaymentEvidence.length, 1);
    assert.equal(task.report?.checks?.unmatchedPayments.length, 0);
    assert.equal(result.value.leases[0].status, 'revoked');
    const receipt = result.value.receipts[0];
    assert.equal(receipt.payload.processor, 'private-record-reconciliation');
    assert.equal((await verifyReceipt(receipt, receipt.publicKey)).valid, true);
    assert.ok(!JSON.stringify(task.report).includes('PRIVATE-'));
    const eur = await call('upload', { name: 'euro.json', content: JSON.stringify({ vendor: 'Euro supplier', invoiceNumber: 'EU-1', date: '2026-11-06', amount: 10, currency: 'EUR' }) });
    assert.equal(eur.status, 200);
    const euroId = eur.value.documents.find(d => d.name === 'euro.json')!.id;
    assert.equal((await call('propose', { prompt: 'Expense report', resourceIds: [ids[0], euroId] })).status, 400);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
