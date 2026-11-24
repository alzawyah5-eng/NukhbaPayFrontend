export type StaffStatus = 'Active' | 'Pending' | 'Suspended';
export type RequestStatus = 'Pending' | 'Review' | 'Approved' | 'Rejected';
export type Risk = 'Low' | 'Medium' | 'High';
export type StaffMember = {
  id: string; name: string; email: string; department: string; role: string;
  status: StaffStatus; lastLoginAtUtc: string | null; initials: string;
};
export type AccessRequest = {
  id: string; request: string; requester: string; department: string;
  submitted: string; status: RequestStatus; risk: Risk; details: string;
};
export type StaffSession = {
  id: string; staff: string; browser: string; platform: string; location: string;
  lastActive: string; status: 'Active' | 'Review' | 'Revoked';
};
export type AuditEvent = {
  id: string; actor: string; action: string; date: string; outcome: 'Approved' | 'Pending' | 'Rejected' | 'Denied'; resource: string;
};

export const initialStaff: StaffMember[] = [
  { id:'stf-1001', name:'Maya Rahman', email:'maya.r@sample.test', department:'Operations', role:'Operations Manager', status:'Active', lastLoginAtUtc:'2026-11-13T05:42:00Z', initials:'MR' },
  { id:'stf-1002', name:'Adam Karim', email:'adam.k@sample.test', department:'Security', role:'Security Admin', status:'Active', lastLoginAtUtc:'2026-11-13T05:26:00Z', initials:'AK' },
  { id:'stf-1003', name:'Lina Farouk', email:'lina.f@sample.test', department:'Catalogue', role:'Catalogue Manager', status:'Pending', lastLoginAtUtc:null, initials:'LF' },
  { id:'stf-1004', name:'Noah Hassan', email:'noah.h@sample.test', department:'Support', role:'Support Agent', status:'Suspended', lastLoginAtUtc:'2026-11-11T14:30:00Z', initials:'NH' },
  { id:'stf-1005', name:'Sarah Amine', email:'sarah.a@sample.test', department:'Compliance', role:'Auditor', status:'Active', lastLoginAtUtc:'2026-11-12T13:11:00Z', initials:'SA' },
  { id:'stf-1006', name:'Sofia Mansour', email:'sofia.m@sample.test', department:'Finance', role:'Finance Reviewer', status:'Active', lastLoginAtUtc:'2026-11-13T04:05:00Z', initials:'SM' },
  { id:'stf-1007', name:'Ahmed Saleh', email:'ahmed.s@sample.test', department:'Catalogue', role:'Catalogue Reviewer', status:'Active', lastLoginAtUtc:'2026-11-12T10:27:00Z', initials:'AS' },
  { id:'stf-1008', name:'Nour Haddad', email:'nour.h@sample.test', department:'Support', role:'Support Lead', status:'Active', lastLoginAtUtc:'2026-11-13T06:00:00Z', initials:'NH' }
];

export const initialRequests: AccessRequest[] = [
  { id:'REQ-701', request:'Pricing approval access', requester:'Maya Rahman', department:'Operations', submitted:'Today, 09:15', status:'Pending', risk:'High', details:'Requests review ability for pricing proposal publication.' },
  { id:'REQ-702', request:'Security role change', requester:'Adam Karim', department:'Security', submitted:'Today, 08:45', status:'Review', risk:'High', details:'Requests a sensitive role change that requires independent review.' },
  { id:'REQ-703', request:'Kiosk admin access', requester:'Lina Farouk', department:'Catalogue', submitted:'Yesterday', status:'Pending', risk:'Medium', details:'Requests access to kiosk configuration views.' },
  { id:'REQ-704', request:'Temporary elevated role', requester:'Noah Hassan', department:'Support', submitted:'Yesterday', status:'Rejected', risk:'High', details:'Temporary role elevation request not approved.' },
  { id:'REQ-705', request:'Catalogue reviewer role', requester:'Sarah Amine', department:'Compliance', submitted:'Nov 11', status:'Approved', risk:'Low', details:'Additional read-only catalogue-review access.' }
];

export const initialSessions: StaffSession[] = [
  { id:'SES-101', staff:'Maya Rahman', browser:'Chrome', platform:'Windows', location:'Dubai, UAE', lastActive:'Today, 09:42', status:'Active' },
  { id:'SES-102', staff:'Adam Karim', browser:'Safari', platform:'macOS', location:'Algiers, Algeria', lastActive:'Today, 09:26', status:'Active' },
  { id:'SES-103', staff:'Lina Farouk', browser:'Chrome', platform:'Android', location:'Location review', lastActive:'Today, 08:14', status:'Review' },
  { id:'SES-104', staff:'Sarah Amine', browser:'Edge', platform:'Windows', location:'Dubai, UAE', lastActive:'Yesterday', status:'Active' },
  { id:'SES-105', staff:'Noah Hassan', browser:'Firefox', platform:'Windows', location:'Algiers, Algeria', lastActive:'Nov 11', status:'Revoked' }
];

export const initialAudit: AuditEvent[] = [
  { id:'EVT-0241', actor:'Adam Karim', action:'Staff role changed', date:'Nov 13 · 09:42', outcome:'Approved', resource:'Staff profile' },
  { id:'EVT-0240', actor:'Maya Rahman', action:'Access request submitted', date:'Nov 13 · 09:31', outcome:'Pending', resource:'Role request' },
  { id:'EVT-0239', actor:'System Policy', action:'Unauthorized action denied', date:'Nov 13 · 08:58', outcome:'Denied', resource:'Permission check' },
  { id:'EVT-0238', actor:'Sarah Amine', action:'Audit log viewed', date:'Nov 12 · 17:11', outcome:'Approved', resource:'Audit event' },
  { id:'EVT-0237', actor:'Adam Karim', action:'Session revoked', date:'Nov 12 · 13:08', outcome:'Approved', resource:'Staff session' },
  { id:'EVT-0236', actor:'Maya Rahman', action:'Role proposal submitted', date:'Nov 11 · 10:12', outcome:'Pending', resource:'Role request' }
];

export const roles = [
  {name:'Super Admin', description:'Restricted · break-glass governance'},
  {name:'Security Admin', description:'Identity, sessions, and reviews'},
  {name:'Operations Manager', description:'Approved operations workflow'},
  {name:'Catalogue Manager', description:'Manage product catalogue data'},
  {name:'Support Agent', description:'Read customer service data'},
  {name:'Auditor', description:'Read immutable audit history'}
];
export const permissionNames = ['Staff profiles', 'Catalogue products', 'Pricing proposals', 'Price publication', 'Provider connections', 'Audit logs', 'Kiosk assignments'];
export const permissionsByRole: Record<string,string[]> = {
  'Super Admin':['view', 'create', 'update', 'approve'],
  'Security Admin':['view', 'update', 'approve'],
  'Operations Manager':['view', 'create', 'update'],
  'Catalogue Manager':['view','create','update'],
  'Support Agent':['view'],
  'Auditor':['view']
};
export const departments = [
  {name:'Operations', count:32, manager:'Maya Rahman'},
  {name:'Catalogue', count:24, manager:'Ahmed Saleh'},
  {name:'Security', count:11, manager:'Adam Karim'},
  {name:'Support', count:39, manager:'Nour Haddad'},
  {name:'Finance', count:14, manager:'Sofia Mansour'},
  {name:'Compliance', count:8, manager:'Sarah Amine'}
];
