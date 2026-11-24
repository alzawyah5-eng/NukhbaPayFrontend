import { createContext, useContext, useState, type ReactNode } from 'react';
import { initialAudit, initialRequests, initialSessions, initialStaff, type AccessRequest, type AuditEvent, type StaffMember, type StaffSession } from './mockData';
import { initials } from '../lib/utils';

type DemoStore = {
  staff: StaffMember[]; requests: AccessRequest[]; sessions: StaffSession[]; audit: AuditEvent[];
  toast: string; notify: (text: string) => void; clearToast: () => void;
  addDemoInvite: (person: { name: string; email: string; department: string; role: string }) => void;
  decideDemoRequest: (id: string, status: 'Approved'|'Rejected', reason: string) => void;
  revokeDemoSession: (id: string, reason: string) => void;
};
const Context = createContext<DemoStore | null>(null);
export function DemoProvider({ children }: { children: ReactNode }) {
  const [staff, setStaff] = useState(initialStaff);
  const [requests, setRequests] = useState(initialRequests);
  const [sessions, setSessions] = useState(initialSessions);
  const [audit, setAudit] = useState(initialAudit);
  const [toast, setToast] = useState('');
  const notify = (text: string) => setToast(text);
  const clearToast = () => setToast('');
  const addDemoInvite = (person: { name: string; email: string; department: string; role: string }) => {
    setStaff(s => [{...person,id:`demo-${Date.now()}`,status:'Pending',lastLoginAtUtc:null,initials:initials(person.name)}, ...s]);
    notify('Demo invitation preview added to local memory. No email was sent and no account was created.');
  };
  const decideDemoRequest = (id: string, status: 'Approved'|'Rejected', reason: string) => {
    setRequests(s => s.map(r => r.id === id ? {...r,status,details:`${r.details} · Preview decision: ${reason}`} : r));
    setAudit(s => [{id:`DEMO-${Date.now()}`,actor:'Preview Operator',action:`Preview decision: ${status}`,date:'Just now',outcome:status,resource:id},...s]);
    notify(`Local demo status changed to ${status}. Nothing was approved, rejected or saved in NukhbaPay.`);
  };
  const revokeDemoSession = (id: string, reason: string) => {
    setSessions(s => s.map(r => r.id === id ? {...r,status:'Revoked'} : r));
    setAudit(s => [{id:`DEMO-${Date.now()}`,actor:'Preview Operator',action:`Simulated session revocation (${reason})`,date:'Just now',outcome:'Approved',resource:id},...s]);
    notify('Session changed to Revoked in local demo data only. No real session was affected.');
  };
  return <Context.Provider value={{staff,requests,sessions,audit,toast,notify,clearToast,addDemoInvite,decideDemoRequest,revokeDemoSession}}>{children}</Context.Provider>;
}
export function useDemo() { const ctx=useContext(Context); if(!ctx) throw new Error('useDemo requires DemoProvider'); return ctx; }
