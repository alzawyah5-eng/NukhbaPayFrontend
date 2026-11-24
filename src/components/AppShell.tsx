import { useState, type FormEvent } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Activity, BarChart3, Bell, Building2, ChevronDown, CircleHelp, ClipboardCheck, FileClock, LayoutDashboard, LockKeyhole, Menu, MonitorSmartphone, Search, Settings, ShieldCheck, UserPlus, Users, X } from 'lucide-react';
import { Button } from './UI';

export const navigation = [
  { path: '/overview', label: 'Overview', icon: LayoutDashboard },
  { path: '/staff', label: 'Staff directory', icon: Users },
  { path: '/staff/invite', label: 'Invite staff', icon: UserPlus },
  { path: '/roles', label: 'Roles & permissions', icon: ShieldCheck },
  { path: '/departments', label: 'Departments', icon: Building2 },
  { path: '/access-requests', label: 'Access requests', icon: ClipboardCheck },
  { path: '/security', label: 'Security center', icon: LockKeyhole },
  { path: '/sessions', label: 'Sessions & devices', icon: MonitorSmartphone },
  { path: '/audit', label: 'Audit logs', icon: FileClock },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export function AppShell() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');
  const navigate = useNavigate();
  function globalSearch(e: FormEvent<HTMLFormElement>) { e.preventDefault(); if (query.trim()) navigate(`/staff?q=${encodeURIComponent(query.trim())}`); }
  return <div className="app-layout">
    {open && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setOpen(false)}/>}
    <aside className={`sidebar ${open ? 'sidebar--open' : ''}`} aria-label="Main navigation">
      <div className="sidebar-brand"><img src="/nukhbapay-original-logo-reference.png" alt="NukhbaPay" /><button className="close-mobile icon-button" aria-label="Close menu" onClick={() => setOpen(false)}><X size={19}/></button></div>
      <div className="side-caption">STAFF WORKSPACE</div>
      <nav className="side-nav">{navigation.map(item => { const Icon = item.icon; return <NavLink key={item.path} to={item.path} end={item.path === '/staff'} onClick={() => setOpen(false)} className={({ isActive }) => `side-link ${isActive ? 'side-link--active' : ''}`}><Icon size={17} aria-hidden="true"/><span>{item.label}</span></NavLink>; })}</nav>
      <div className="sidebar-bottom"><div className="staff-avatar">SA</div><div><strong>Staff Admin</strong><small>Preview workspace</small></div><ChevronDown size={16} className="side-bottom-chevron"/></div>
      <div className="sidebar-caption-bottom">Illustrative interface · no live data</div>
    </aside>
    <div className="app-right"><header className="topbar"><button className="mobile-menu icon-button" aria-label="Open navigation" onClick={() => setOpen(true)}><Menu size={22}/></button><form className="global-search" onSubmit={globalSearch}><Search size={16} aria-hidden="true"/><input aria-label="Search staff by name, email, or role" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search staff by name, email, or role" /></form><div className="topbar-actions"><button className="text-action" onClick={() => setNotice('Help is not connected in this frontend preview.')}><CircleHelp size={17}/><span>Help</span></button><button aria-label="Notifications" className="top-icon" onClick={() => setNotice('Notifications will connect to the central staff API later.')}><Bell size={18}/></button><button className="top-profile" aria-label="Preview user menu" onClick={() => setNotice('Demo preview only — no staff identity or signed-in session.')}><span>SA</span><ChevronDown size={14}/></button></div></header><main className="main-content"><div className="demo-ribbon"><Activity size={14} aria-hidden="true"/> UI PREVIEW ONLY — fictional records, no real login, approvals, or API actions</div>{notice && <div className="top-notice" role="status"><span>{notice}</span><button aria-label="Dismiss notice" onClick={() => setNotice('')}><X size={15}/></button></div>}<Outlet /></main></div>
  </div>;
}

export function PageHeading({ title, subtitle, actionLabel, onAction, actionDisabled = false }: { title: string; subtitle: string; actionLabel?: string; onAction?: () => void; actionDisabled?: boolean }) {
  return <div className="page-heading"><div><h1>{title}</h1><p>{subtitle}</p></div>{actionLabel && <Button onClick={onAction} disabled={actionDisabled}>{actionLabel}</Button>}</div>;
}
