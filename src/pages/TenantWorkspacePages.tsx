import { useEffect, useState, useRef, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ShieldCheck } from 'lucide-react';
import { Button, Notice, Panel, StatCard, StatGrid } from '../components/UI';
import type { StaffProfile } from '../session';

type Role = {code:string;description:string;assigned:boolean;permissions:readonly {code:string;description:string}[]};
type Locale = 'en-GB'|'en-US'|'fr-FR'|'ar-AE';
type InvitationRole = 'SUPPORT_AGENT'|'CATALOG_OPERATOR';
interface StaffWorkspaceData {
  departments:readonly {id:string;name:string;version:number}[];
  invitations:readonly {id:string;name:string;email:string;departmentId:string|null;role:string;requesterId:string;
    state:'SUBMITTED'|'CANCELLED'|'EXPIRED';version:number;createdAt:string;expiresAt:string}[];
  settings:{locale:Locale;timeZone:string;version:number;contact?:{name:string;email:string}|null};
  reports:{activeStaff:number;activeMemberships:number;departments:number};
  activity:readonly {id:string;action:string;actorId:string;targetId:string;occurredAt:string}[];
}
type StaffWorkspaceCommand =
  | {action:'create-department';id:string;name:string}
  | {action:'rename-department';id:string;version:number;name:string}
  | {action:'submit-invitation';id:string;name:string;email:string;departmentId:string|null;role:InvitationRole}
  | {action:'cancel-invitation';id:string;version:number}
  | {action:'save-settings';version:number;timeZone:string;locale:Locale;contact?:{name:string;email:string}};
type ViewData = StaffWorkspaceData & {
  roles:{roles:readonly Role[]};
  security:{mfaRequired:boolean;commandAssuranceEstablished:boolean};
  sessions:{currentSession:boolean;items?:readonly {id:string;createdAtMs:number;lastUsedAtMs:number;expiresAtMs:number;state:string}[]};
};
type State<T> = { kind:'loading' } | { kind:'failed';message:string } | { kind:'ready';data:T };
const roleNames:Record<string,string>={SUPPORT_AGENT:'Support Agent',CATALOG_OPERATOR:'Catalogue Operator'};
const label=(value:string)=>roleNames[value]??value.toLowerCase().split(/[_-]/).map(part=>part[0]?.toUpperCase()+part.slice(1)).join(' ');
const date=(value:string|number)=>new Date(value).toLocaleString();
const explanation=(code:number)=>code===401?'Your staff session has expired. Sign in again.'
  : code===403?'Your role does not allow this action.'
  : code===409?'The record already exists or has changed. Refresh and try again.'
  : code===400?'Check the entered details and try again.'
  : 'The workspace could not complete the request. Try again.';

function useView<Key extends keyof ViewData>(key:Key) {
  const [attempt,setAttempt]=useState(0);
  const [state,setState]=useState<State<ViewData[Key]>>({kind:'loading'});
  useEffect(()=>{
    const controller=new AbortController();
    setState({kind:'loading'});
    void (async()=>{
      try {
        const response=await fetch('/staff-api/workspace/'+key,{credentials:'same-origin',cache:'no-store',signal:controller.signal});
        if (!response.ok) {
          if (!controller.signal.aborted) setState({kind:'failed',message:explanation(response.status)});
          return;
        }
        const data:unknown=await response.json();
        const expectedArray=['departments','invitations','activity'].includes(key);
        if (typeof data!=='object'||data===null||Array.isArray(data)!==expectedArray) throw new Error();
        if (!controller.signal.aborted) setState({kind:'ready',data:data as ViewData[Key]});
      } catch {
        if (!controller.signal.aborted) setState({kind:'failed',message:explanation(503)});
      }
    })();
    return ()=>controller.abort();
  },[attempt,key]);
  return {state,refresh:()=>setAttempt(value=>value+1)};
}

function useCommand(csrfToken:string) {
  const lock=useRef(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  async function save(command:StaffWorkspaceCommand,success:()=>void) {
    if (lock.current) return;
    lock.current=true;
    setBusy(true);
    setError('');
    try {
      const response=await fetch('/staff-api/workspace',{method:'POST',credentials:'same-origin',cache:'no-store',
        headers:{'content-type':'application/json','x-csrf-token':csrfToken},body:JSON.stringify(command)});
      if (response.status===204) success();
      else setError(explanation(response.status));
    } catch { setError(explanation(503)); }
    finally { lock.current=false; setBusy(false); }
  }
  return {busy,error,save};
}

function Content<T>({state,retry,children}:{state:State<T>;retry:()=>void;children:(data:T)=>ReactNode}) {
  if (state.kind==='loading') return <p role="status">Loading workspace data…</p>;
  if (state.kind==='failed') return <><Notice tone="warning">{state.message}</Notice><Button variant="secondary" onClick={retry}>Try again</Button></>;
  return children(state.data);
}

function Failure({text}:{text:string}) {return text?<div role="alert"><Notice tone="warning">{text}</Notice></div>:null;}
function Table({headers,children}:{headers:readonly string[];children:ReactNode}) {
  return <div className="table-scroll"><table className="data-table">
    <thead><tr>{headers.map(header=><th scope="col" key={header}>{header}</th>)}</tr></thead>
    <tbody>{children}</tbody>
  </table></div>;
}

export function WorkspaceRolesPage() {
  const data=useView('roles');
  const [code,setCode]=useState('');
  return <Content state={data.state} retry={data.refresh}>{({roles})=>{
    const selected=roles.find(row=>row.code===code)??roles.find(row=>row.assigned)??roles[0];
    return <div className="roles-grid"><Panel title="Available roles" subtitle="Select a role to inspect access" className="roles-list-panel">
      <div className="role-list">{roles.map((role,i)=><button key={role.code} aria-pressed={role===selected}
        className={'role-entry'+(role===selected?' role-entry--active':'')} onClick={()=>setCode(role.code)}>
        <span className={'feed-icon feed-icon--'+(i%2?'green':'purple')}><ShieldCheck size={16}/></span>
        <span><strong>{label(role.code)}</strong><small>{role.description}</small></span>{role===selected&&<ChevronRight size={16}/>}
      </button>)}</div></Panel>
      <Panel title={selected?'Permission matrix — '+label(selected.code):'Role permissions'} subtitle={selected?.assigned?'Assigned to you':'Tenant role definition'} className="permissions-panel">
        {selected?<Table headers={['Permission','Authorized operation']}>{selected.permissions.map(permission=>
          <tr key={permission.code}><td><code>{permission.code}</code></td><td>{permission.description}</td></tr>)}</Table>
          :<p>No tenant roles are assigned to you.</p>}
      </Panel></div>;
  }}</Content>;
}

export function ManagementOverview({profile}:{profile:StaffProfile}){
  return <>
    {profile.navigation.includes('/reports')&&<OverviewFigures/>}
    <div className="dashboard-split">
      {profile.navigation.includes('/audit')&&<WorkspaceActivityPage recent/>}
      {profile.navigation.includes('/access-requests')&&<OverviewRequests/>}
    </div>
  </>;
}
function OverviewFigures(){
  const view=useView('reports');
  return <Content state={view.state} retry={view.refresh}>{data=><StatGrid>
    <StatCard label="Active staff" value={data.activeStaff} detail="Active accounts with an active membership"/>
    <StatCard label="Active memberships" value={data.activeMemberships} detail="Current tenant" accent="green"/>
    <StatCard label="Departments" value={data.departments} detail="Current tenant"/>
  </StatGrid>}</Content>;
}
function OverviewRequests(){
  const view=useView('invitations');
  return <Panel title="Pending approvals" subtitle="Recent onboarding requests" className="approvals-panel">
    <Content state={view.state} retry={view.refresh}>{rows=>{
      const pending=rows.filter(row=>row.state==='SUBMITTED').slice(0,3);
      return pending.length?<div className="activity-feed">{pending.map(row=><Link key={row.id} to="/access-requests" className="feed-row">
        <span className="feed-icon feed-icon--purple"><ShieldCheck size={17}/></span><span className="feed-copy"><strong>{row.name}</strong>
          <small>{label(row.role)} · {date(row.createdAt)}</small></span></Link>)}</div>:<p>No pending requests in the recent activity.</p>;
    }}</Content><Link className="btn btn--primary" to="/access-requests">Open access requests</Link></Panel>;
}

export function WorkspaceDepartmentsPage({csrfToken}:{csrfToken:string}) {
  const data=useView('departments'),command=useCommand(csrfToken);
  const [editing,setEditing]=useState<{id:string;name:string;version:number}|null>(null);
  const [name,setName]=useState('');
  const id=useRef<string|undefined>(undefined);
  function submit(event:FormEvent) {
    event.preventDefault();
    if (editing) void command.save({action:'rename-department',id:editing.id,version:editing.version,name},saved);
    else {
      id.current??=crypto.randomUUID();
      void command.save({action:'create-department',id:id.current,name},saved);
    }
  }
  function saved() {setEditing(null);setName('');id.current=undefined;data.refresh();}
  return <>
    <Panel title={editing?'Rename department':'Add department'}>
      <form className="settings-fields" onSubmit={submit}>
        <label>Department name <input required minLength={2} maxLength={120} value={name} onChange={event=>{setName(event.target.value);id.current=undefined;}}/></label>
        <Failure text={command.error}/>
        <div className="topbar-actions">
          <Button disabled={command.busy} type="submit">{editing?'Save department':'Add department'}</Button>
          {editing && <Button variant="secondary" onClick={()=>{setEditing(null);setName('');}}>Cancel edit</Button>}
        </div>
      </form>
    </Panel>
    <Panel title="Tenant departments"><Content state={data.state} retry={data.refresh}>{rows=>
      rows.length?<Table headers={['Department','Action']}>{rows.map(row=><tr key={row.id}>
        <td>{row.name}</td><td><Button variant="secondary" disabled={command.busy} onClick={()=>{setEditing(row);setName(row.name);}}>Rename</Button></td>
      </tr>)}</Table>:<p>No departments have been created for this tenant.</p>}
    </Content></Panel>
  </>;
}

export function WorkspaceInvitePage({csrfToken}:{csrfToken:string}) {
  const data=useView('departments'),command=useCommand(csrfToken);
  const [name,setName]=useState('');
  const [email,setEmail]=useState('');
  const [department,setDepartment]=useState('');
  const [role,setRole]=useState<'SUPPORT_AGENT'|'CATALOG_OPERATOR'>('SUPPORT_AGENT');
  const [submitted,setSubmitted]=useState(false);
  const id=useRef<string|undefined>(undefined);
  function submit(event:FormEvent) {
    event.preventDefault();
    id.current??=crypto.randomUUID();
    void command.save({action:'submit-invitation',id:id.current,name,email,departmentId:department||null,role},()=>setSubmitted(true));
  }
  if (submitted) return <Panel title="Onboarding request submitted">
    <p>The request is saved for independent review. Account creation and delivery follow approval.</p>
    <Link className="btn btn--primary" to="/access-requests">Open access requests</Link>
  </Panel>;
  return <Panel title="Staff invitation request"><form className="settings-fields" onSubmit={submit}>
    <label>Full name <input autoComplete="off" required minLength={2} maxLength={120} value={name} onChange={event=>{setName(event.target.value);id.current=undefined;}}/></label>
    <label>Work email <input autoComplete="off" type="email" required maxLength={254} value={email} onChange={event=>{setEmail(event.target.value);id.current=undefined;}}/></label>
    <Content state={data.state} retry={data.refresh}>{rows=><label>Department <select value={department} onChange={event=>{setDepartment(event.target.value);id.current=undefined;}}>
      <option value="">No department selected</option>{rows.map(row=><option key={row.id} value={row.id}>{row.name}</option>)}
    </select></label>}</Content>
    <label>Requested role <select value={role} onChange={event=>{setRole(event.target.value==='CATALOG_OPERATOR'?'CATALOG_OPERATOR':'SUPPORT_AGENT');id.current=undefined;}}>
      <option value="SUPPORT_AGENT">Support Agent</option><option value="CATALOG_OPERATOR">Catalogue Operator</option>
    </select></label>
    <Failure text={command.error}/>
    <Button type="submit" disabled={command.busy}>Submit for review</Button>
  </form></Panel>;
}

export function WorkspaceRequestsPage({csrfToken,staffId}:{csrfToken:string;staffId:string}) {
  const data=useView('invitations'),command=useCommand(csrfToken);
  const [confirm,setConfirm]=useState<string|null>(null);
  return <Panel title="Onboarding requests" action={<Button variant="secondary" onClick={data.refresh}>Refresh</Button>}>
    <Failure text={command.error}/>
    <Content state={data.state} retry={data.refresh}>{rows=>
      rows.length?<Table headers={['Staff member','Requested role','Status','Submitted','Action']}>{rows.map(row=><tr key={row.id}>
        <td><strong>{row.name}</strong><br/>{row.email}</td><td>{label(row.role)}</td>
        <td>{row.state==='SUBMITTED'?'Awaiting review':label(row.state)}</td><td>{date(row.createdAt)}</td>
        <td>{row.state==='SUBMITTED' && row.requesterId===staffId && (confirm===row.id
          ? <><Button disabled={command.busy} onClick={()=>void command.save({action:'cancel-invitation',id:row.id,version:row.version},
            ()=>{setConfirm(null);data.refresh();})}>Confirm cancellation</Button><Button variant="secondary" onClick={()=>setConfirm(null)}>Keep request</Button></>
          : <Button variant="secondary" onClick={()=>setConfirm(row.id)}>Cancel request</Button>)}</td>
      </tr>)}</Table>:<p>No onboarding requests have been submitted.</p>}
    </Content>
  </Panel>;
}

export function WorkspaceSecurityPage({profile}:{profile:StaffProfile}) {
  const data=useView('security');
  return <Panel title="Authentication and authorization"><Content state={data.state} retry={data.refresh}>{policy=>
    <dl className="workspace-facts">
      <div><dt>Interactive staff sign-in</dt><dd>{policy.mfaRequired?'Auth0 and MFA required':'Policy unavailable'}</dd></div>
      <div><dt>Valid until</dt><dd>{date(profile.expiresAtMs)}</dd></div>
      <div><dt>Privileged command assurance</dt><dd>{policy.commandAssuranceEstablished?'Established':'Requires a separate verified challenge'}</dd></div>
    </dl>}
  </Content></Panel>;
}

export function WorkspaceSessionsPage({profile,signOut,busy}:{profile:StaffProfile;signOut:()=>void;busy:boolean}) {
  const data=useView('sessions');
  return <Panel title="Your staff sessions"><Content state={data.state} retry={data.refresh}>{sessions=>
    sessions.currentSession?<><dl className="workspace-facts">
      <div><dt>Session</dt><dd>Current browser</dd></div><div><dt>Valid until</dt><dd>{date(profile.expiresAtMs)}</dd></div>
      <div><dt>Action</dt><dd><Button disabled={busy} variant="secondary" onClick={signOut}>Sign out this browser</Button></dd></div>
    </dl>{sessions.items?.length ? <Table headers={['Session','Started','Last used','State']}>{sessions.items.map(row=><tr key={row.id}>
      <td><code>{row.id}</code></td><td>{date(row.createdAtMs)}</td><td>{date(row.lastUsedAtMs)}</td><td>{label(row.state)}</td>
    </tr>)}</Table>:null}</>:<p>No current staff session.</p>}
  </Content></Panel>;
}

export function WorkspaceReportsPage() {
  const data=useView('reports');
  return <Panel title="Current staffing report"><Content state={data.state} retry={data.refresh}>{figures=>{
    const metrics=[['Active staff',figures.activeStaff],['Active memberships',figures.activeMemberships],['Departments',figures.departments]] as const;
    function download() {
      const file=new Blob(['Metric,Count\r\n',...metrics.map(([title,value])=>title+','+value+'\r\n')],{type:'text/csv'});
      const link=document.createElement('a');
      link.href=URL.createObjectURL(file);
      link.download='nukhbapay-staff-report.csv';
      link.click();
      setTimeout(()=>URL.revokeObjectURL(link.href),1000);
    }
    return <><StatGrid>{metrics.map(([title,value])=><StatCard key={title} label={title} value={String(value)} detail="Current tenant"/>)}</StatGrid>
      <Button variant="secondary" onClick={download}>Download CSV</Button></>;
  }}</Content></Panel>;
}

function PreferencesForm({item,csrfToken,onSaved}:{item:StaffWorkspaceData['settings'];csrfToken:string;onSaved:()=>void}) {
  const command=useCommand(csrfToken);
  const [timeZone,setTimeZone]=useState(item.timeZone);
  const [locale,setLocale]=useState(item.locale);
  const [name,setName]=useState(item.contact?.name??''),[email,setEmail]=useState(item.contact?.email??'');
  return <form className="settings-fields" onSubmit={event=>{
    event.preventDefault();
    void command.save({action:'save-settings',version:item.version,timeZone,locale,...(name&&email?{contact:{name,email}}:{})},onSaved);
  }}>
    <label>Display name <input autoComplete="name" required={!!email||!!item.contact} minLength={2} maxLength={120} value={name} onChange={e=>setName(e.target.value)}/></label>
    <label>Work contact email <input type="email" autoComplete="email" required={!!name||!!item.contact} maxLength={254} value={email} onChange={e=>setEmail(e.target.value)}/></label>
    <p>These details belong to your workspace profile. Your sign-in email is managed in Auth0.</p>
    <label>Time zone <input required maxLength={100} value={timeZone} onChange={event=>setTimeZone(event.target.value)} placeholder="Asia/Dubai"/></label>
    <label>Date and time format <select value={locale} onChange={event=>setLocale(event.target.value as typeof locale)}>
      <option value="en-GB">English (UK)</option><option value="en-US">English (US)</option>
      <option value="fr-FR">French (France)</option><option value="ar-AE">Arabic (UAE)</option>
    </select></label>
    <p>Preview {new Date().toLocaleString(locale,{timeZone:item.timeZone})}</p>
    <Failure text={command.error}/><Button type="submit" disabled={command.busy}>Save preferences</Button>
  </form>;
}

export function WorkspaceSettingsPage({csrfToken}:{csrfToken:string}) {
  const data=useView('settings');
  const [saved,setSaved]=useState(false);
  return <Panel title="Your workspace preferences">
    {saved && <p role="status">Preferences saved.</p>}
    <Content state={data.state} retry={data.refresh}>{item=><PreferencesForm key={item.version} item={item} csrfToken={csrfToken}
      onSaved={()=>{setSaved(true);data.refresh();}}/>}</Content>
  </Panel>;
}

export function WorkspaceActivityPage({recent=false}:{recent?:boolean}) {
  const data=useView('activity');
  return <Panel title={recent?'Recent staff activity':'Staff workspace changes'} className="activity-panel"><Content state={data.state} retry={data.refresh}>{rows=>
    rows.length?<Table headers={['Action','Actor','Target','Time']}>{(recent?rows.slice(0,5):rows).map(row=><tr key={row.id}>
      <td>{label(row.action)}</td><td><code>{row.actorId}</code></td><td><code>{row.targetId}</code></td><td>{date(row.occurredAt)}</td>
    </tr>)}</Table>:<p>No workspace changes have been recorded.</p>}
  </Content></Panel>;
}
