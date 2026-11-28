import { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, BarChart3, BookOpen, Building2, ClipboardCheck, History, LayoutGrid, LockKeyhole, Menu,
  MonitorSmartphone, RefreshCw, Settings, ShieldCheck, UserPlus, Users, X } from 'lucide-react';
import { StaffCommandPage } from './pages/StaffCommandPage';
import { PublicationCommandsPage } from './pages/PublicationCommandsPage';
import { CataloguePage } from './pages/CataloguePage';
import { StaffDirectoryPage, StaffAuditPage } from './pages/StaffManagementPages';
import { ManagementOverview, WorkspaceActivityPage, WorkspaceDepartmentsPage, WorkspaceInvitePage, WorkspaceReportsPage, WorkspaceRequestsPage,
  WorkspaceRolesPage, WorkspaceSecurityPage, WorkspaceSessionsPage, WorkspaceSettingsPage } from './pages/TenantWorkspacePages';
import { Button, Notice, Panel, StatusBadge } from './components/UI';
import { readSession, readLoginConfig, sessionExpiryDelay, signOut, serverLogoutPolicy, type SessionState, type StaffProfile, type WorkspacePath } from './session';
import { departmentName, isDepartment, priorDepartment, rememberDepartment, roleName, type Department } from './department';
import { DepartmentEntry, DepartmentPicker } from './pages/DepartmentEntry';
import { PageHeading } from './components/AppShell';
import './platform.css';

const pages = {
  '/overview': { label: 'Overview', icon: LayoutGrid, description: 'Staff account and session' },
  '/staff': { label: 'Staff directory', icon: Users, description: 'Tenant memberships and assigned roles' },
  '/staff/invite': { label: 'Invite staff', icon: UserPlus, description: 'Prepare an onboarding request for review' },
  '/roles': { label: 'Roles & permissions', icon: ShieldCheck, description: 'Tenant role definitions and your assigned access' },
  '/departments': { label: 'Departments', icon: Building2, description: 'Manage departments for your tenant' },
  '/access-requests': { label: 'Access requests', icon: ClipboardCheck, description: 'Track submitted onboarding requests' },
  '/security': { label: 'Security center', icon: LockKeyhole, description: 'Authentication and command assurance' },
  '/sessions': { label: 'Sessions & devices', icon: MonitorSmartphone, description: 'Manage your staff session' },
  '/audit': { label: 'Audit logs', icon: History, description: 'Tenant access and security decisions' },
  '/reports': { label: 'Reports', icon: BarChart3, description: 'Current tenant staffing and departments' },
  '/settings': { label: 'Settings', icon: Settings, description: 'Personal workspace preferences' },
  '/catalogue': { label: 'Catalogue', icon: BookOpen, description: 'Products, offers and catalogue activity' },
  '/staff/commands': { label: 'Staff commands', icon: ShieldCheck, description: 'Review or execute a prepared staff request' },
  '/catalogue/publication': { label: 'Publication commands', icon: ClipboardCheck, description: 'Approve or publish a prepared revision' },
} satisfies Record<WorkspacePath, { label: string; icon: typeof LayoutGrid; description: string }>;

const staffDetail = /^\/staff\/([0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i;
const sessionTime = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit', second: '2-digit' });

function WorkspaceOverview({profile, checking, refresh}:{profile:StaffProfile;checking:boolean;refresh:()=>void}) {
  const modules=profile.navigation.filter(path=>path!=='/overview');
  return <>
    <Panel className="workspace-account" title="Your staff session" action={<StatusBadge status="Active"/>}>
      <dl className="workspace-facts">
        <div><dt>Staff ID</dt><dd><code>{profile.staffId}</code></dd></div>
        <div><dt>Tenant</dt><dd>{profile.tenantId ? <code>{profile.tenantId}</code> : 'Platform workspace'}</dd></div>
        <div><dt>Session valid until</dt><dd><time dateTime={new Date(profile.expiresAtMs).toISOString()}>{sessionTime.format(profile.expiresAtMs)}</time></dd></div>
      </dl>
    </Panel>
    <Panel title="Workspace access" action={<Button variant="secondary" onClick={refresh} disabled={checking}>
      {checking ? 'Checking access…' : 'Refresh access'}
    </Button>}>
      {modules.length ? <div className="workspace-modules">
        {modules.map(path=>{
          const page=pages[path];
          return <Link className="workspace-module" to={path} key={path}>
            <span className="workspace-module-icon"><page.icon size={20} aria-hidden="true"/></span>
            <span><strong>{page.label}</strong><small>{page.description}</small></span>
            <ArrowRight size={16} aria-hidden="true"/>
          </Link>;
        })}
      </div> : <p className="workspace-muted">You currently have access to your own staff profile. Management pages appear here when your role and the server configuration allow them.</p>}
    </Panel>
  </>;
}

export function PlatformApp({management=false}:{management?:boolean}={}) {
  const [session, setSession] = useState<SessionState>({ kind: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [checking, setChecking] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [fxRefreshing, setFxRefreshing] = useState(false);
  const [fxNotice, setFxNotice] = useState<{message:string;tone:'info'|'warning'|'success'}>();
  const [fxRevision, setFxRevision] = useState(0);
  const [open, setOpen] = useState(false);
  const [loginPath,setLoginPath]=useState<'/auth/login'|undefined>();
  const [departmentLogin,setDepartmentLogin]=useState(false);
  const [department,setDepartment]=useState<Department|''>(priorDepartment);
  const navigate=useNavigate();
  const {pathname,search} = useLocation();
  const failed=(pathname==='/login' || management && pathname==='/') && search==='?sign-in=failed';
  const refresh=()=>setAttempt(n=>n+1);
  useEffect(() => {
    const controller = new AbortController();
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(16_000)]);
    setChecking(true);
    void Promise.all([readSession(signal),readLoginConfig(signal)]).then(([value,config])=>{
      if(controller.signal.aborted)return;
      setSession(value);
      setLoginPath(config?.path);
      setDepartmentLogin(config?.departmentLogin===true);
      setChecking(false);
    });
    return () => controller.abort();
  }, [attempt]);
  useEffect(()=>{
    const onFocus=()=>setAttempt(n=>n+1);
    window.addEventListener('focus',onFocus);
    return ()=>window.removeEventListener('focus',onFocus);
  },[]);
  useEffect(()=>{
    if(session.kind!=='authenticated')return;
    const timer=setTimeout(()=>setSession({kind:'anonymous'}),sessionExpiryDelay(session.profile.expiresAtMs));
    return ()=>clearTimeout(timer);
  },[session]);
  async function logout() {
    if (session.kind !== 'authenticated' || busy) return;
    setBusy(true); setError('');
    const result=await signOut(session.csrfToken,serverLogoutPolicy(document),window.location.origin);
    if (result.ok) window.location.assign(result.destination);
    else { setError('Sign out could not be confirmed. Please retry.'); setBusy(false); }
  }

  async function refreshFxRates() {
    if (session.kind!=='authenticated' || !session.profile.canRefreshFxRates || fxRefreshing) return;
    setFxRefreshing(true);
    setFxNotice(undefined);
    try {
      const response = await fetch('/staff-api/catalogue/refresh-rates', {
        method:'POST', credentials:'same-origin', cache:'no-store',
        headers:{'x-csrf-token':session.csrfToken},
      });
      if (!response.ok) throw new Error();
      const result = await response.json();
      if (result?.status==='not-configured') {
        setFxNotice({tone:'warning',message:'Exchange-rate refresh is unavailable until the Currency API key is configured.'});
      } else if (result?.status==='already-running') {
        setFxNotice({tone:'info',message:'An exchange-rate refresh is already running. Try again when it finishes.'});
      } else if (result?.status==='completed' && [result.ratesFetched,result.converted,result.pending,result.failedCurrencies]
          .every(value=>Number.isSafeInteger(value) && value>=0)) {
        setFxRevision(value=>value+1);
        const counts = `Saved ${result.ratesFetched} new exchange rates. ${result.converted} catalogue amounts have AED conversions. ${result.pending} await a rate.`;
        setFxNotice(result.failedCurrencies>0
          ? {tone:'warning', message:`${counts} Currency API quotes were unavailable for ${result.failedCurrencies} currencies.`}
          : {tone:'success',message:counts});
      } else throw new Error();
    } catch {
      setFxNotice({tone:'warning',message:'Exchange-rate refresh could not be confirmed. Please retry.'});
    } finally {
      setFxRefreshing(false);
    }
  }

  if (session.kind !== 'authenticated' || failed) {
    const chooseDepartment=departmentLogin && !management;
    const canStart=Boolean(loginPath && (session.kind==='anonymous' || session.kind==='unavailable'));
    const canRetry=session.kind==='unavailable' || session.kind==='forbidden' || session.kind==='anonymous' && !loginPath;
    return <main className="platform-login" aria-busy={checking || signingIn}>
      <section className="platform-login-card">
        <img src="/nukhbapay-original-logo-reference.png" alt="NukhbaPay" width={160}/>
        <h1>{pathname==='/auth/logged-out' ? 'You’re signed out'  : management ? 'Staff management sign-in' : 'Staff sign-in'}</h1>
        {failed && <div role="alert"><Notice tone="warning">The sign-in attempt could not be completed. Start a fresh sign-in and finish MFA in this tab.</Notice></div>}
        <p>{session.kind==='loading' ? 'Checking your staff session…' :
          session.kind==='unavailable' ? 'The staff session could not be checked.' :
          session.kind==='forbidden' ? 'Access to this staff workspace was denied.' :
          canStart ? 'Enter your account details and complete MFA on the secure sign-in page.' :
          session.kind==='anonymous' ? 'Staff sign-in is currently unavailable.' : 'Your existing staff session is active.'}</p>
        {!management && departmentLogin && canStart && <DepartmentPicker value={department} onChange={setDepartment}/>}
        {canStart && <Button disabled={signingIn || checking || chooseDepartment && !department} onClick={()=>{
          if(!loginPath || signingIn || checking || chooseDepartment && !department)return;
          if(chooseDepartment && department)rememberDepartment(department);
          if(management){try{sessionStorage.setItem('nukhbapay.management-login','pending');}catch{/* Reopen the bookmark after MFA. */}}
          setSigningIn(true);
          window.location.assign(loginPath);
        }}>{signingIn ? 'Opening secure sign-in…' : 'Continue with secure sign in'}<ArrowRight size={17} aria-hidden="true"/></Button>}
        {canRetry && <Button variant="secondary" disabled={checking} onClick={refresh}>{checking ? 'Checking…' : 'Try again'}</Button>}
        {failed && session.kind==='authenticated' && <Link className="btn btn--primary" to="/overview">Return to workspace</Link>}
        <span className="platform-login-security"><LockKeyhole size={15} aria-hidden="true"/>Multi-factor authentication required</span>
      </section>
    </main>;
  }

  const profile=session.profile;
  const entry=pathname.match(/^\/department\/([a-z]+)$/)?.[1];
  const selected=profile.departmentAccess?.selected;
  if(management && (!profile.departmentAccess || selected?.department!=='central')){
    return <DepartmentEntry management department="" access={profile.departmentAccess??{positions:[],selected:null}}
      csrfToken={session.csrfToken} finish={refresh} logout={()=>void logout()} change={()=>{}}/>;
  }
  if(!management && profile.departmentAccess){
    const desired=isDepartment(entry)?entry:department||(isDepartment(selected?.department)?selected.department:'');
    if((!selected || selected.department==='central' || entry) && desired && pathname!=='/department/'+desired)
      return <Navigate replace to={'/department/'+desired}/>;
    if(!selected || selected.department==='central' || entry || pathname==='/department')return <DepartmentEntry key={entry??'choose'} department={desired||''} access={profile.departmentAccess}
      csrfToken={session.csrfToken} logout={()=>void logout()} change={value=>{
        setDepartment(value);if(value){rememberDepartment(value);navigate('/department/'+value,{replace:true});}
        else navigate('/department',{replace:true});
      }} finish={()=>{refresh();}}/>;
  }
  if(pathname==='/' || pathname==='/login' || pathname==='/auth/logged-out')return <Navigate replace to="/overview"/>;
  const navigation=(Object.keys(pages) as WorkspacePath[]).filter(path=>profile.navigation.includes(path));
  const detail=staffDetail.exec(pathname)?.[1]?.toLowerCase();
  const accessPath=detail ? '/staff' : profile.navigation.find(path=>path===pathname);
  const active=accessPath && profile.navigation.includes(accessPath) ? accessPath : undefined;
  const heading=active ? detail ? 'Staff member' : pages[active].label : 'Page unavailable';

  return <div className="app-layout">
    {open && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setOpen(false)}/>}
    <aside className={'sidebar'+(open?' sidebar--open':'')} aria-label="Staff navigation">
      <div className="sidebar-brand"><Link to="/overview" aria-label="NukhbaPay staff overview" onClick={()=>setOpen(false)}>
        <img src="/nukhbapay-original-logo-reference.png" alt="NukhbaPay"/>
      </Link><button className="close-mobile icon-button" aria-label="Close menu" onClick={() => setOpen(false)}><X/></button></div>
      <div className="side-caption">STAFF WORKSPACE</div>
      <nav className="side-nav">{navigation.map(path=>{
        const page=pages[path];
        return <NavLink key={path} to={path} end onClick={()=>setOpen(false)}
          className={'side-link'+(active===path?' side-link--active':'')} aria-current={active===path?'page':undefined}>
          <page.icon size={17} aria-hidden="true"/>{page.label}
        </NavLink>;
      })}</nav>
    </aside>
    <div className="app-right">
      <header className="topbar">
        <button className="mobile-menu icon-button" aria-label="Open navigation" aria-expanded={open} onClick={() => setOpen(true)}><Menu/></button>
        {selected?<Link to={management?'/overview':'/department/'+selected.department}>{management?'Central management':departmentName(selected.department as Department)} · {roleName(selected.role)}</Link>:<span>Staff workspace</span>}
        <div className="topbar-actions">
          {active==='/catalogue' && profile.canRefreshFxRates && <Button variant="secondary" disabled={fxRefreshing || busy}
            onClick={()=>void refreshFxRates()}><RefreshCw size={15} aria-hidden="true"/>
            {fxRefreshing ? 'Refreshing exchange rates?' : 'Refresh exchange rates'}
          </Button>}
          <Button variant="secondary" disabled={busy} onClick={() => void logout()}>
          {busy ? 'Signing out…' : 'Sign out'}
        </Button></div>
      </header>
      <main className="main-content workspace-content">
        <PageHeading title={active==='/overview'?(management?'Staff management overview':'Staff overview'):heading} subtitle={active && !detail ? pages[active].description : ''}
          {...(active==='/overview' && navigation.includes('/staff/invite') && {actionLabel:'Invite staff',onAction:()=>navigate('/staff/invite')})}/>
        {error && <div role="alert"><Notice tone="warning">{error}</Notice></div>}
        {active==='/catalogue' && profile.canRefreshFxRates && <div role="status">
          {fxNotice && <Notice tone={fxNotice.tone}>{fxNotice.message}</Notice>}
        </div>}
        {active==='/overview' && <>{management && <ManagementOverview profile={profile}/>}<WorkspaceOverview profile={profile} checking={checking} refresh={refresh}/></>}
        {active==='/staff' && <StaffDirectoryPage key={detail??'directory'} staffId={detail}/>}
        {active==='/staff/invite' && <WorkspaceInvitePage csrfToken={session.csrfToken}/>}
        {active==='/roles' && <WorkspaceRolesPage/>}
        {active==='/departments' && <WorkspaceDepartmentsPage csrfToken={session.csrfToken}/>}
        {active==='/access-requests' && <WorkspaceRequestsPage csrfToken={session.csrfToken} staffId={profile.staffId}/>}
        {active==='/security' && <WorkspaceSecurityPage profile={profile}/>}
        {active==='/sessions' && <WorkspaceSessionsPage profile={profile} signOut={()=>void logout()} busy={busy}/>}
        {active==='/audit' && <><StaffAuditPage/>{profile.navigation.includes('/roles') && <WorkspaceActivityPage/>}</>}
        {active==='/reports' && <WorkspaceReportsPage/>}
        {active==='/settings' && <WorkspaceSettingsPage csrfToken={session.csrfToken}/>}
        {active==='/catalogue' && <CataloguePage csrfToken={session.csrfToken} fxRevision={fxRevision}/>}
        {active==='/catalogue/publication' && <PublicationCommandsPage csrfToken={session.csrfToken}/>}
        {active==='/staff/commands' && <StaffCommandPage csrfToken={session.csrfToken}/>}
        {!active && <Panel title="Workspace access">
          <Notice tone="warning">This page is unavailable for your current staff session.</Notice>
          <Link to="/overview" className="btn btn--secondary">Back to overview</Link>
        </Panel>}
      </main>
    </div>
  </div>;
}
