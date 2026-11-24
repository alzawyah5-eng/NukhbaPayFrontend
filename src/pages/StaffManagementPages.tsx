import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, DataTable, EmptyState, Notice, Panel, StatusBadge } from '../components/UI';

const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const identifier=(value:unknown):value is string=>typeof value==='string' && uuid.test(value);
const record=(value:unknown):value is Record<string,unknown>=>Boolean(value && typeof value==='object' && !Array.isArray(value));
const staffStatuses=['PENDING','ACTIVE','SUSPENDED','DISABLED'];
const membershipStatuses=['ACTIVE','SUSPENDED','REVOKED'];
const auditOutcomes=['SUCCESS','DENIED','FAILURE'];
const auditActions=['STAFF_IDENTITY_RESOLUTION','STAFF_MEMBERSHIP_RESOLUTION','AUTHORIZATION_DECISION','SECURITY_AUDIT_APPEND'];
const activityTime=new Intl.DateTimeFormat(undefined,{dateStyle:'medium',timeStyle:'short'});

interface StaffRow {
  id:string;
  status:string;
  membershipStatus:string;
  version:string;
  roles:string[];
}
interface AuditRow {
  id:string;
  occurredAt:string;
  action:string;
  outcome:string;
  actorStaffId:string|null;
}

function staffRow(value:unknown):value is StaffRow {
  return record(value) && identifier(value.id) &&
    typeof value.status==='string' && staffStatuses.includes(value.status) &&
    typeof value.membershipStatus==='string' && membershipStatuses.includes(value.membershipStatus) &&
    typeof value.version==='string' && /^[1-9][0-9]{0,18}$/.test(value.version) &&
    Array.isArray(value.roles) && value.roles.length<=12 && value.roles.every(role=>typeof role==='string' && /^[A-Z][A-Z0-9_]{0,63}$/.test(role));
}

function auditRow(value:unknown):value is AuditRow {
  return record(value) && identifier(value.id) && (value.actorStaffId===null || identifier(value.actorStaffId)) &&
    typeof value.occurredAt==='string' && Number.isFinite(Date.parse(value.occurredAt)) &&
    typeof value.action==='string' && auditActions.includes(value.action) &&
    typeof value.outcome==='string' && auditOutcomes.includes(value.outcome);
}

type PageResult<Row>={kind:'loading'|'expired'|'forbidden'|'missing'|'unavailable'} |
  {kind:'ready'; items:Row[]; next:string|null};

function useRecords<Row>(path:string, row:(value:unknown)=>value is Row) {
  const [trail,setTrail]=useState<string[]>([]);
  const [attempt,setAttempt]=useState(0);
  const [result,setResult]=useState<PageResult<Row>>({kind:'loading'});
  const cursor=trail.at(-1);
  useEffect(()=>{
    const controller=new AbortController();
    const query=new URLSearchParams({limit:'20'});
    if(cursor)query.set('after',cursor);
    const finish=(value:PageResult<Row>)=>{ if(!controller.signal.aborted)setResult(value); };
    setResult({kind:'loading'});
    void (async()=>{
      try {
        const response=await fetch(path+'?'+query,{credentials:'same-origin',cache:'no-store',signal:controller.signal});
        if(response.status===401)return finish({kind:'expired'});
        if(response.status===403)return finish({kind:'forbidden'});
        if(response.status===404)return finish({kind:'missing'});
        if(!response.ok)return finish({kind:'unavailable'});
        const data:unknown=await response.json();
        if(!record(data) || !Array.isArray(data.items) || data.items.length>20 || !data.items.every(row) ||
          (data.next!==null && !identifier(data.next)) || data.next!==null && data.next===cursor) return finish({kind:'unavailable'});
        finish({kind:'ready',items:data.items,next:data.next});
      }catch{finish({kind:'unavailable'});}
    })();
    return ()=>controller.abort();
  },[path,cursor,attempt,row]);
  return {
    result,
    retry:()=>setAttempt(n=>n+1),
    controls:<><span>Page {trail.length+1}</span><div className="pagination-controls">
      {trail.length>0 && <Button variant="secondary" onClick={()=>setTrail(previous=>previous.slice(0,-1))}>Previous page</Button>}
      {result.kind==='ready' && result.next!==null && <Button variant="secondary" onClick={()=>{
        const next=result.next;
        if(next)setTrail(previous=>[...previous,next]);
      }}>Next page</Button>}
    </div></>,
  };
}

const readMessages={
  loading:'Loading records…',
  expired:'Your session expired. Sign in again to continue.',
  forbidden:'Your current staff access does not allow this page.',
  missing:'This record is unavailable in your tenant.',
  unavailable:'The service could not load these records.',
} as const;

function ReadState({kind,retry}:{kind:keyof typeof readMessages;retry:()=>void}) {
  return <>
    <Notice tone={kind==='loading'?'info':'warning'}>{readMessages[kind]}</Notice>
    {kind==='unavailable' && <Button variant="secondary" onClick={retry}>Try again</Button>}
    {kind==='expired' && <a className="btn btn--secondary" href="/login">Sign in again</a>}
  </>;
}

function readable(value:string) {
  return value.charAt(0)+value.slice(1).toLowerCase().replaceAll('_',' ');
}

export function StaffDirectoryPage({staffId}:{staffId:string|undefined}) {
  const {result,retry,controls}=useRecords(staffId ? '/staff-api/staff/'+staffId : '/staff-api/staff',staffRow);
  if(staffId){
    const item=result.kind==='ready' ? result.items.find(row=>row.id===staffId) : undefined;
    return <Panel title="Membership" action={<Link className="btn btn--secondary" to="/staff">Back to directory</Link>}>
      {item ? <dl className="workspace-facts">
        <div><dt>Staff ID</dt><dd><code>{item.id}</code></dd></div>
        <div><dt>Account status</dt><dd><StatusBadge status={readable(item.status)}/></dd></div>
        <div><dt>Membership status</dt><dd><StatusBadge status={readable(item.membershipStatus)}/></dd></div>
        <div><dt>Roles</dt><dd>{item.roles.map(readable).join(', ') || 'None assigned'}</dd></div>
        <div><dt>Membership version</dt><dd>{item.version}</dd></div>
      </dl> : <ReadState kind={result.kind==='ready'?'missing':result.kind} retry={retry}/>}
    </Panel>;
  }
  return <Panel title="Tenant staff">
    {result.kind==='ready' ? <DataTable rows={result.items} footer={controls} empty="No staff records were returned for this tenant." columns={[
      {key:'id',label:'Staff ID',render:row=><Link className="workspace-record-link" to={'/staff/'+row.id}><code>{row.id}</code></Link>},
      {key:'account',label:'Account',render:row=><StatusBadge status={readable(row.status)}/>},
      {key:'membership',label:'Membership',render:row=><StatusBadge status={readable(row.membershipStatus)}/>},
      {key:'roles',label:'Roles',render:row=>row.roles.map(readable).join(', ') || 'None assigned'},
    ]}/> : <ReadState kind={result.kind} retry={retry}/>}
  </Panel>;
}

export function StaffAuditPage() {
  const {result,retry,controls}=useRecords('/staff-api/audit',auditRow);
  return <Panel title="Security decisions">
    {result.kind==='ready' ? result.items.length ? <DataTable rows={result.items} footer={controls} columns={[
      {key:'time',label:'Occurred',render:row=><time dateTime={row.occurredAt}>{activityTime.format(new Date(row.occurredAt))}</time>},
      {key:'action',label:'Action',render:row=>readable(row.action)},
      {key:'outcome',label:'Outcome',render:row=><StatusBadge status={row.outcome==='FAILURE'?'Failed':readable(row.outcome)}/>},
      {key:'actor',label:'Staff ID',render:row=>row.actorStaffId ? <code>{row.actorStaffId}</code> : 'System'},
    ]}/> : <><EmptyState title="No audit activity" description="There are no recorded decisions on this page."/>
      <div className="table-footer">{controls}</div></> : <ReadState kind={result.kind} retry={retry}/>}
  </Panel>;
}
