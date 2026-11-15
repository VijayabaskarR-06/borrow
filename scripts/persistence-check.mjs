import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { verifyReceipt } from "./verify-receipt.mjs";

// Keep the synthetic account credentials in memory across an operator restart.
const base = (process.argv[2] || "https://your-hostname.example").replace(
  /\/$/,
  "",
);
let cookie = "";
async function call(path, body) {
  const r = await fetch(base + path, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      cookie,
      origin: base,
      ...(body === undefined ? {} : { "content-type": "application/json" }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const value = await r.json();
  assert.equal(r.status, 200, `${path}: ${JSON.stringify(value)}`);
  if (r.headers.has("set-cookie"))
    cookie = r.headers.get("set-cookie").split(";")[0];
  return value;
}
const email = `persistence-${randomUUID()}@example.test`,
  password = randomBytes(24).toString("base64url");
await call("/api/auth/signup", { email, password });
let state = await call("/api/borrow/propose", {
  prompt: "Prepare October expense report",
});
const workspace = state.workspace.id,
  taskId = state.activeTaskId;
const task = state.tasks.find((t) => t.id === taskId);
state = await call("/api/borrow/approve", { taskId });
for (let i = 0; i < task.totalSteps; i++)
  state = await call("/api/borrow/step", { taskId });
assert.equal(state.tasks.find((t) => t.id === taskId).report.total, 3784.5);
const receipt = state.receipts.find((r) => r.taskId === taskId),
  hash = receipt.hash;
assert.equal((await verifyReceipt(receipt, receipt.publicKey)).valid, true);
console.log(
  "CHECKPOINT: account, report and signed receipt saved. Recreate the app container, wait for health, then send a newline to resume.",
);
await new Promise((resolve) => {
  process.stdin.resume();
  process.stdin.once("data", resolve);
});
process.stdin.pause();
assert.equal((await call("/api/auth/session")).authenticated, true);
await call("/api/auth/signout", {});
await call("/api/auth/signin", { email, password });
state = await call("/api/borrow/state");
assert.equal(state.workspace.id, workspace);
assert.equal(state.tasks.find((t) => t.id === taskId).report.total, 3784.5);
const persisted = state.receipts.find((r) => r.taskId === taskId);
assert.equal(persisted.hash, hash);
assert.equal((await verifyReceipt(persisted, receipt.publicKey)).valid, true);
console.log(
  "PASS: after container recreation, session signature, email sign-in, encrypted workspace, completed report, receipt hash and original signing key all survive.",
);
