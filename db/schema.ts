import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
// Each encrypted aggregate contains User, Workspace, DataSource, Document and
// DocumentVersion, Task, IntentCapsule, Lease, PolicyDecision, AgentRun,
// AuditEvent, PrivacyReceipt and BlockchainAnchor equivalents. A CAS version
// prevents simultaneous requests from losing a policy decision.
export const workspaces=sqliteTable('borrow_workspaces',{id:text('id').primaryKey(),version:integer('version').notNull(),payload:text('payload').notNull()});
