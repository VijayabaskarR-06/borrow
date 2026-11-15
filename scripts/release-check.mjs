import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { verifyReceipt } from "./verify-receipt.mjs";

// Runs against a production server. Creates only synthetic, isolated QA data.
const base = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");
let cookie = "";
async function request(path, body, expected = 200, origin = base) {
  const response = await fetch(base + path, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      cookie,
      origin,
      ...(body === undefined ? {} : { "content-type": "application/json" }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const value = await response.json();
  assert.equal(response.status, expected, `${path}: ${JSON.stringify(value)}`);
  if (response.headers.has("set-cookie"))
    cookie = response.headers.get("set-cookie").split(";")[0];
  return { response, value };
}
await request("/api/health");
await request("/api/borrow/state", undefined, 401);
await request("/api/auth/guest", {}, 403, "https://cross-origin.example");
const email = `qa-${randomUUID()}@example.test`,
  password = randomBytes(24).toString("base64url");
const signup = await request("/api/auth/signup", { email, password });
assert.match(signup.response.headers.get("set-cookie"), /HttpOnly/i);
assert.match(signup.response.headers.get("set-cookie"), /SameSite=Lax/i);
assert.match(signup.response.headers.get("set-cookie"), /Secure/i);
let { value: state } = await request("/api/borrow/state");
const workspace = state.workspace.id;
const invoice = {
  vendor: "Synthetic release QA",
  invoiceNumber: "QA-OCT-2026",
  date: "2026-10-20",
  amount: 42.75,
  currency: "USD",
  category: "Software",
  description: "Synthetic QA invoice",
  bankAccount: "QA-PRIVATE-NOT-FOR-REPORT",
};
({ value: state } = await request("/api/borrow/upload", {
  name: "release-qa.json",
  mimeType: "application/json",
  content: JSON.stringify(invoice),
}));
const document = state.documents.find((d) => d.name === "release-qa.json");
assert(document);
const { value: preview } = await request(
  "/api/borrow/document?id=" + document.id,
);
assert.equal(preview.fields.amount, 42.75);
assert.equal(preview.fields.bankAccount, undefined);
await request(
  "/api/borrow/upload",
  {
    name: "unsupported.pdf",
    mimeType: "application/pdf",
    content: "synthetic",
  },
  400,
);
({ value: state } = await request("/api/borrow/propose", {
  prompt: "Prepare October expense report",
  resourceIds: [document.id],
}));
let task = state.tasks.find((t) => t.id === state.activeTaskId);
({ value: state } = await request("/api/borrow/approve", {
  taskId: task.id,
  durationSeconds: 300,
}));
for (let i = 0; i < task.totalSteps; i++)
  ({ value: state } = await request("/api/borrow/step", { taskId: task.id }));
task = state.tasks.find((t) => t.id === task.id);
assert.equal(task.report.total, 42.75);
assert(!JSON.stringify(task.report).includes(invoice.bankAccount));
const receipt = state.receipts.find((r) => r.id === task.receiptId);
assert.equal((await verifyReceipt(receipt, receipt.publicKey)).valid, true);
const altered = structuredClone(receipt);
altered.payload.completionStatus = "altered";
assert.equal((await verifyReceipt(altered, receipt.publicKey)).valid, false);
await request("/api/auth/signout", {});
await request("/api/borrow/state", undefined, 401);
await request(
  "/api/auth/signin",
  { email, password: "invalid-password-123" },
  401,
);
await request("/api/auth/signin", { email, password });
({ value: state } = await request("/api/borrow/state"));
assert.equal(state.workspace.id, workspace);
assert.equal(state.tasks.find((t) => t.id === task.id).report.total, 42.75);
const accountCookie = cookie;
cookie = accountCookie.slice(0, -1) + (accountCookie.endsWith("a") ? "b" : "a");
await request("/api/borrow/state", undefined, 401);
cookie = "";
await request("/api/auth/guest", {});
await request("/api/borrow/document?id=" + document.id, undefined, 404);
({ value: state } = await request("/api/borrow/state"));
assert.notEqual(state.workspace.id, workspace);
assert(!state.documents.some((d) => d.id === document.id));
console.log(
  "PASS: production auth/cookie flags; signup/signout/signin; rejected bad credentials/cookie/CSRF; JSON upload/preview/report; private-field filtering; offline receipt/tamper; account persistence; cross-workspace document isolation.",
);
