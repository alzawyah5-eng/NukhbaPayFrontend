import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { DemoProvider, useDemo } from './data/DemoContext';
import { X } from 'lucide-react';
import {
  AccessRequestsPage, AuditPage, DepartmentsPage, InviteStaffPage, LoginPage,
  NotFoundPage, OverviewPage, ReportsPage, RolesPage, SecurityPage,
  SessionsPage, SettingsPage, StaffDirectoryPage, StaffProfilePage
} from './pages/DashboardPages';

function DemoToast() { const {toast,clearToast}=useDemo();return toast?<div className="demo-toast" role="status"><span>{toast}</span><button aria-label="Close message" onClick={clearToast}><X size={17}/></button></div>:null; }
export default function App() {return <DemoProvider><Routes>
  <Route path="/login" element={<LoginPage/>}/>
  <Route path="/" element={<AppShell/>}>
    <Route index element={<Navigate to="/overview" replace/>}/>
    <Route path="overview" element={<OverviewPage/>}/>
    <Route path="staff" element={<StaffDirectoryPage/>}/>
    <Route path="staff/invite" element={<InviteStaffPage/>}/>
    <Route path="staff/:staffId" element={<StaffProfilePage/>}/>
    <Route path="roles" element={<RolesPage/>}/>
    <Route path="departments" element={<DepartmentsPage/>}/>
    <Route path="access-requests" element={<AccessRequestsPage/>}/>
    <Route path="security" element={<SecurityPage/>}/>
    <Route path="sessions" element={<SessionsPage/>}/>
    <Route path="audit" element={<AuditPage/>}/>
    <Route path="reports" element={<ReportsPage/>}/>
    <Route path="settings" element={<SettingsPage/>}/>
    <Route path="*" element={<NotFoundPage/>}/>
  </Route>
</Routes><DemoToast/></DemoProvider>}
