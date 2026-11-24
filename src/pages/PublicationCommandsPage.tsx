import { useEffect, useState, type FormEvent } from 'react';
import { Button, Notice, Panel } from '../components/UI';

const endpoint = '/staff-api/commands/publication';
const actions = { APPROVE: 'Approve draft', ACTIVATE: 'Activate version', ROLLBACK: 'Restore prior version' } as const;
type Action = keyof typeof actions;
const confirmations = { APPROVE: 'Confirm approval', ACTIVATE: 'Confirm activation', ROLLBACK: 'Confirm rollback' } as const;
interface Intent {
  action: Action;
  productId: string;
  candidateId: string;
  candidateVersion: number;
  expectedActiveId: string | null;
  rollbackSourceId: string | null;
  reason: string | null;
  idempotencyKey: string;
}
const messages = {
  LOADING: 'Checking publication confirmation.',
  STEP_UP_REQUIRED: 'Verify your identity before confirming a publication command.',
  RECORDED: 'The publication command was recorded in the disposable catalogue.',
  REPLAYED: 'The existing publication record was found.',
  EXPIRED_SESSION: 'Your session expired. Sign in again.',
  FORBIDDEN: 'This publication command is unavailable for your current access.',
  UNRESOLVED: 'The result could not be confirmed. Retry the same command to check the existing record.',
} as const;
type Status = keyof typeof messages | 'READY';

export function PublicationCommandsPage({csrfToken}:{csrfToken:string}) {
  const [status,setStatus]=useState<Status>('LOADING');
  const [intent,setIntent]=useState<Intent>();
  const [action,setAction]=useState<Action>('APPROVE');
  const [busy,setBusy]=useState(false);

  useEffect(()=>{
    const controller=new AbortController();
    void (async()=>{
      try {
        const response=await fetch(endpoint,{credentials:'same-origin',cache:'no-store',signal:controller.signal});
        const value=await response.json();
        if(controller.signal.aborted)return;
        if(response.ok && value.state==='READY' && Object.hasOwn(actions,value.action)) {
          const {action,productId,candidateId,candidateVersion,expectedActiveId,rollbackSourceId,reason,idempotencyKey}=value;
          setIntent({action,productId,candidateId,candidateVersion,expectedActiveId,rollbackSourceId,reason,idempotencyKey});
          setStatus('READY');
        } else if(response.ok && value.state==='STEP_UP_REQUIRED') setStatus('STEP_UP_REQUIRED');
        else setStatus(response.status===401?'EXPIRED_SESSION':response.status===403?'FORBIDDEN':'UNRESOLVED');
      } catch {if(!controller.signal.aborted)setStatus('UNRESOLVED');}
    })();
    return ()=>controller.abort();
  },[csrfToken]);

  async function submit(event:FormEvent<HTMLFormElement>,mode:'start'|'confirm'|'retry') {
    event.preventDefault();
    if(busy)return;
    let command:Intent|undefined=intent;
    if(mode==='start') {
      const form=new FormData(event.currentTarget);
      const field=(name:string)=>String(form.get(name)??'').trim();
      command={action,productId:field('product').toLowerCase(),candidateId:field('candidate').toLowerCase(),
        candidateVersion:Number(field('version')),expectedActiveId:field('head').toLowerCase()||null,
        rollbackSourceId:field('source').toLowerCase()||null,reason:field('reason')||null,idempotencyKey:crypto.randomUUID()};
      setIntent(command);
    }
    if(!command)return;
    setBusy(true);
    try {
      const response=await fetch(mode==='confirm'?endpoint+'/confirm':endpoint,{method:'POST',credentials:'same-origin',cache:'no-store',
        headers:{'content-type':'application/json','x-csrf-token':csrfToken},body:JSON.stringify(mode==='confirm'?{}:command)});
      const value=await response.json();
      if(mode!=='confirm' && response.ok && value.state==='STEP_UP_REQUIRED' && typeof value.location==='string') {
        const url=new URL(value.location);
        if(url.protocol!=='https:'||url.pathname!=='/authorize'||url.username||url.password)throw new Error();
        window.location.assign(url.href);
        return;
      }
      if(value.state==='RECORDED'||value.state==='REPLAYED'||value.state==='STEP_UP_REQUIRED'||value.state==='UNRESOLVED')setStatus(value.state);
      else setStatus(response.status===401?'EXPIRED_SESSION':'FORBIDDEN');
    } catch {setStatus('UNRESOLVED');}
    finally {setBusy(false);}
  }

  return <Panel title="Disposable publication">
    {status==='READY' && intent ? <form onSubmit={event=>void submit(event,'confirm')}>
      <dl><dt>Action</dt><dd>{actions[intent.action]}</dd>
        <dt>Product</dt><dd>{intent.productId}</dd>
        <dt>Candidate</dt><dd>{intent.candidateId}</dd>
        <dt>Candidate version</dt><dd>{intent.candidateVersion}</dd>
        {intent.expectedActiveId && <><dt>Current publication</dt><dd>{intent.expectedActiveId}</dd></>}
        {intent.rollbackSourceId && <><dt>Restore from</dt><dd>{intent.rollbackSourceId}</dd><dt>Reason</dt><dd>{intent.reason}</dd></>}
      </dl>
      <Button type="submit" disabled={busy}>{confirmations[intent.action]}</Button>
    </form> : <Notice>{messages[status==='READY'?'UNRESOLVED':status]}</Notice>}
    {status==='UNRESOLVED' && intent && <form onSubmit={event=>void submit(event,'retry')}>
      <Button type="submit" disabled={busy}>Verify and retry this command</Button>
    </form>}
    {status==='STEP_UP_REQUIRED' && <form onSubmit={event=>void submit(event,'start')}>
      <div className="form-field"><label htmlFor="publication-action">Action</label>
        <select id="publication-action" value={action} onChange={event=>setAction(event.target.value as Action)}>
          {Object.entries(actions).map(([value,label])=><option key={value} value={value}>{label}</option>)}
        </select></div>
      <div className="form-field"><label htmlFor="publication-product">Product ID</label>
        <input id="publication-product" name="product" required maxLength={36}/></div>
      <div className="form-field"><label htmlFor="publication-candidate">Candidate digest</label>
        <input id="publication-candidate" name="candidate" required pattern="[0-9a-fA-F]{64}"/></div>
      <div className="form-field"><label htmlFor="publication-version">Candidate version</label>
        <input id="publication-version" name="version" type="number" min="1" max={Number.MAX_SAFE_INTEGER} required/></div>
      {action!=='APPROVE' && <div className="form-field"><label htmlFor="publication-head">Current publication ID</label>
        <input id="publication-head" name="head" maxLength={36} required={action==='ROLLBACK'}/></div>}
      {action==='ROLLBACK' && <>
        <div className="form-field"><label htmlFor="publication-source">Prior publication ID</label>
          <input id="publication-source" name="source" required maxLength={36}/></div>
        <div className="form-field"><label htmlFor="publication-reason">Reason</label>
          <input id="publication-reason" name="reason" required minLength={3} maxLength={256}/></div>
      </>}
      <Button type="submit" disabled={busy}>Verify identity</Button>
    </form>}
  </Panel>;
}
