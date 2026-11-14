import type { AuditEvent, Lease } from '../contracts';
import { canonical, sha256, sign, verify } from './crypto';
import type { GatewayRequest, GatewayResult, WorkspaceState } from './models';
export function leasePayload(lease:Lease) { const {signature,status,revokedAt,revokeReason,...signed}=lease;return signed; }
export async function signLease(lease:Lease,state:WorkspaceState) { lease.signature=await sign(leasePayload(lease),state.privateKey); }
export function leaseStatus(lease:Lease,now=Date.now()):Lease['status'] { return lease.revokedAt?'revoked':Date.parse(lease.expiresAt)<=now?'expired':'active'; }
export async function appendEvent(state:WorkspaceState,event:Omit<AuditEvent,'id'|'sequence'|'timestamp'|'previousHash'|'hash'>):Promise<AuditEvent> {
  const base={...event,id:crypto.randomUUID(),sequence:state.events.length+1,timestamp:new Date().toISOString(),previousHash:state.events.at(-1)?.hash??'GENESIS'};
  const record={...base,hash:await sha256(canonical(base))};state.events.push(record);return record;
}
export async function authorize(state:WorkspaceState,request:GatewayRequest):Promise<GatewayResult> {
  const lease=state.leases.find(l=>l.id===request.leaseId); const now=request.now??Date.now();
  let reason='AUTHORIZED';
  if(!request.userId)reason='UNAUTHENTICATED';
  else if(request.userId!==state.userId || request.workspaceId!==state.id)reason='WORKSPACE_MISMATCH';
  else if(!lease)reason='LEASE_NOT_FOUND';
  else if(lease.userId!==request.userId || lease.workspaceId!==request.workspaceId)reason='WORKSPACE_MISMATCH';
  else if(!(await verify(leasePayload(lease),lease.signature,state.publicKey)))reason='INVALID_LEASE_SIGNATURE';
  else if(lease.revokedAt)reason='LEASE_REVOKED';
  else if(Date.parse(lease.expiresAt)<=now || !Number.isFinite(Date.parse(lease.expiresAt)))reason='LEASE_EXPIRED';
  else if(!state.tasks.some(t=>t.id===lease.taskId && t.capsule.approvalStatus==='approved'))reason='APPROVAL_REQUIRED';
  else if(!['read','write_report','analyze'].includes(request.operation)||!lease.allowedOperations.includes(request.operation))reason='OPERATION_NOT_ALLOWED';
  else if(!lease.outputDestinations.includes(request.destination))reason='DESTINATION_NOT_ALLOWED';
  else if(request.operation==='read' && !lease.resourceIds.includes(request.resourceId))reason='OUTSIDE_APPROVED_SCOPE';
  else if(['write_report','analyze'].includes(request.operation) && request.resourceId!==`report:${lease.taskId}`)reason='OUTSIDE_APPROVED_SCOPE';
  else if(request.fields.some(f=>!lease.allowedFields.includes(f)))reason='FIELD_NOT_ALLOWED';
  const document=state.documents.find(d=>d.id===request.resourceId);
  if(reason==='AUTHORIZED' && request.operation==='read' && (!document || document.workspaceId!==state.id))reason='RESOURCE_NOT_FOUND';
  const decision=reason==='AUTHORIZED'?'ALLOW':'DENY';
  await appendEvent(state,{taskId:lease?.taskId??state.activeTaskId??'unassigned',leaseId:lease?.id,type:'POLICY_DECISION',title:decision==='ALLOW'?'Scoped access granted':'Access blocked',description:decision==='ALLOW'?`${request.operation} permitted for ${request.resourceId}. Only approved fields can cross the gateway.`:`${request.operation} of ${request.resourceId} denied: ${reason}. No protected data was returned.`,decision,reason,resourceId:request.resourceId,operation:request.operation,fields:decision==='ALLOW'&&request.operation==='analyze'?[...request.fields]:decision==='ALLOW'&&document&&request.operation==='read'?request.fields.filter(field=>Object.hasOwn(document.fields,field)):[],destination:request.destination});
  if(decision==='DENY')return {decision,reason};
  const data:Record<string,unknown>={};if(request.operation==='read' && document)for(const field of request.fields){if(Object.hasOwn(document.fields,field))data[field]=structuredClone(document.fields[field]);}
  return {decision,reason,data};
}
export async function verifyEventChain(events:AuditEvent[]):Promise<boolean>{let previous='GENESIS';let sequence=1;for(const event of events){if(!event||typeof event!=='object'||Array.isArray(event))return false;const {hash,...body}=event;if(event.previousHash!==previous || event.sequence!==sequence || await sha256(canonical(body))!==hash)return false;previous=hash;sequence++;}return true;}
