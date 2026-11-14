import type { AuditEvent, CoreState, DocumentSummary, ExpenseReport, Lease, PrivacyReceipt, ProbeResult, Task, VerificationResult } from '../contracts';
export interface StoredDocument extends DocumentSummary { workspaceId: string; version: number; fields: Record<string,unknown>; content: string; synthetic: boolean; }
export interface AgentRun { id: string; taskId: string; status: 'running' | 'completed' | 'stopped'; disclosed: Record<string, Record<string,unknown>>; pendingInferenceId?: string; pendingInferenceAt?: number; }
export interface WorkspaceState { id: string; userId: string; name: string; coreState: CoreState; documents: StoredDocument[]; tasks: Task[]; leases: Lease[]; events: AuditEvent[]; receipts: PrivacyReceipt[]; runs: AgentRun[]; activeTaskId: string | null; privateKey: JsonWebKey; publicKey: JsonWebKey; latestVerification?: VerificationResult; probeResult?: ProbeResult; }
export interface GatewayRequest { userId: string; workspaceId: string; leaseId: string; resourceId: string; operation: string; fields: string[]; destination: string; now?: number; }
export interface GatewayResult { decision: 'ALLOW' | 'DENY'; reason: string; data?: Record<string,unknown>; }
export interface ServerEnv { BORROW_MASTER_KEY?: string; BORROW_DATA_DIR?: string; OPENAI_API_KEY?: string; OPENAI_MODEL?: string; [key: string]: unknown; }
export interface D1Statement { bind(...values: unknown[]): D1Statement; first<T>(): Promise<T|null>; run(): Promise<{meta?:{changes?:number};success?:boolean}>; }
export interface Database { prepare(query:string): D1Statement; }
export interface ApiContext { userId: string; env?: ServerEnv; db?: Database; }
