import { useEffect, useState, type FormEvent } from 'react';
import { Button, Notice, Panel } from '../components/UI';

const path = '/staff-api/commands/suspension';
type State = { state:'LOADING'|'STEP_UP_REQUIRED'|'APPLIED'|'RECORDED'|'REPLAYED'|'FORBIDDEN'|'EXPIRED_SESSION'|'UNRESOLVED' } |
  { state:'READY';requestId:string;requestVersion:string;targetStaffId:string;decision?:'APPROVE'|'REJECT' };

export function StaffCommandPage({csrfToken}:{csrfToken:string}) {
  const [result,setResult]=useState<State>({state:'LOADING'});
  const [requestId,setRequestId]=useState('');
  const [action,setAction]=useState('EXECUTE');
  const [pending,setPending]=useState(false);
  useEffect(()=>{
    const controller=new AbortController();
    void (async()=>{
      try {
        const response=await fetch(path,{credentials:'same-origin',cache:'no-store',signal:controller.signal});
        const value=await response.json() as Partial<Omit<Extract<State,{state:'READY'}>,'state'>> & {state?:string} | null;
        if (controller.signal.aborted) return;
        if (response.ok && value?.state==='READY' && typeof value.requestId==='string' &&
            typeof value.requestVersion==='string' && typeof value.targetStaffId==='string' &&
            (value.decision===undefined || value.decision==='APPROVE' || value.decision==='REJECT')) {
          const {requestId,requestVersion,targetStaffId,decision}=value;
          setResult({state:'READY',requestId,requestVersion,targetStaffId,...(decision && {decision})});
        } else if (response.ok && value?.state==='STEP_UP_REQUIRED') setResult({state:'STEP_UP_REQUIRED'});
        else if (response.status===401) setResult({state:'EXPIRED_SESSION'});
        else if (response.status===403) setResult({state:'FORBIDDEN'});
        else setResult({state:'UNRESOLVED'});
      } catch {if (!controller.signal.aborted) setResult({state:'UNRESOLVED'});}
    })();
    return ()=>controller.abort();
  },[csrfToken]);
  async function submit(event:FormEvent, confirmation:boolean) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    try {
      const response=await fetch(confirmation ? path+'/confirm' : path,{method:'POST',credentials:'same-origin',cache:'no-store',
        headers:{'content-type':'application/json','x-csrf-token':csrfToken},
        body:JSON.stringify(confirmation ? {} : {requestId:requestId.toLowerCase(),idempotencyKey:crypto.randomUUID(),
          ...(action!=='EXECUTE' && {decision:action})})});
      const value=await response.json() as {state?:State['state']|'DENIED';location?:string};
      if (response.ok && !confirmation && value.state==='STEP_UP_REQUIRED' && typeof value.location==='string') {
        const url=new URL(value.location);
        if (url.protocol!=='https:' || url.pathname!=='/authorize' || url.username || url.password) throw new Error();
        window.location.assign(url.href);
        return;
      }
      if (value.state==='STEP_UP_REQUIRED' || value.state==='APPLIED' || value.state==='RECORDED' || value.state==='REPLAYED' ||
          value.state==='EXPIRED_SESSION' || value.state==='UNRESOLVED') setResult({state:value.state});
      else setResult({state:'FORBIDDEN'});
    } catch {setResult({state:'UNRESOLVED'});}
    finally {setPending(false);}
  }
  const messages={
    LOADING:'Checking the current session…', STEP_UP_REQUIRED:'Verify your identity to review the suspension request.',
    RECORDED:'Your review decision was recorded.',
    APPLIED:'The membership was suspended and existing sessions were revoked.', REPLAYED:'This request was already applied.',
    FORBIDDEN:'This request is unavailable or your current access does not permit it.',
    EXPIRED_SESSION:'Your session expired. Sign in again.',
    UNRESOLVED:'The result could not be confirmed. Check the request record before trying again.',
  } as const;
  return <Panel title="Membership suspension">
    {result.state==='READY' ? <form onSubmit={event=>void submit(event,true)}>
      <p>Request {result.requestId}, version {result.requestVersion}</p>
      <p>Staff member {result.targetStaffId}</p>
      <Button type="submit" disabled={pending}>{result.decision==='APPROVE' ? 'Confirm approval' :
        result.decision==='REJECT' ? 'Confirm rejection' : 'Confirm suspension'}</Button>
    </form> : <div role="status"><Notice>{messages[result.state]??messages.UNRESOLVED}</Notice></div>}
    {result.state==='STEP_UP_REQUIRED' && <form onSubmit={event=>void submit(event,false)}>
      <div className="form-field"><label htmlFor="suspension-request-id">Request ID</label>
      <input id="suspension-request-id" required pattern="[0-9a-fA-F-]{36}" value={requestId} onChange={event=>setRequestId(event.target.value)}/></div>
      <div className="form-field"><label htmlFor="suspension-action">Action</label>
      <select id="suspension-action" value={action} onChange={event=>setAction(event.target.value)}>
        <option value="EXECUTE">Execute suspension</option>
        <option value="APPROVE">Approve request</option>
        <option value="REJECT">Reject request</option>
      </select></div>
      <Button type="submit" disabled={pending}>Verify identity</Button>
    </form>}
  </Panel>;
}
