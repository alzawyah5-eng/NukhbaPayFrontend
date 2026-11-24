import { useState } from 'react';
import { Button, Notice } from '../components/UI';
import { departments, departmentName, isDepartment, roleName, type Department, type DepartmentAccess } from '../department';

export function DepartmentPicker({value,onChange}:{value:Department|'';onChange:(value:Department|'')=>void}){
  return <div className="form-field"><label htmlFor="entry-department">Department</label>
    <select id="entry-department" value={value} onChange={e=>onChange(isDepartment(e.target.value)?e.target.value:'')}>
      <option value="">Choose your department</option>
      {departments.map(code=><option key={code} value={code}>{departmentName(code)}</option>)}
    </select></div>;
}

export function DepartmentEntry({management=false,department,change,access,csrfToken,finish,logout}:{management?:boolean;department:Department|'';
  change:(value:Department|'')=>void;access:DepartmentAccess;csrfToken:string;finish:()=>void;logout:()=>void}){
  const [pending,setPending]=useState(false),[error,setError]=useState('');
  const positions=access.positions.filter(row=>row.department===department);
  async function select(code:string,role:string){
    if(pending)return;
    setPending(true);setError('');
    try {
      const response=await fetch('/auth/position',{method:'POST',credentials:'same-origin',cache:'no-store',
        headers:{'Content-Type':'application/json','x-csrf-token':csrfToken},body:JSON.stringify({department:code,role})});
      if(response.status!==204)throw new Error();
      window.location.replace(management?'/management/overview':'/overview');
    }catch{setError('Your role could not be opened. Refresh access and try again.');}
    finally{setPending(false);}
  }
  return <main className="platform-login"><section className="platform-login-card">
    <img src="/nukhbapay-original-logo-reference.png" alt="NukhbaPay" width={160}/>
    <h1>{management?'Staff management':department?departmentName(department):'Staff workspace'}</h1>
    {!management && <DepartmentPicker value={department} onChange={value=>{setError('');change(value);}}/>}
    {department && (positions.length?<><h2>Choose your assigned role</h2>
      {positions.map(p=><Button key={p.role} disabled={pending} onClick={()=>void select(p.department,p.role)}>{roleName(p.role)}</Button>)}</>
      : <Notice>No active role is assigned to you in this department. Contact your staff manager if you need access.</Notice>)}
    {error && <p role="alert">{error}</p>}
    {management && !access.positions.some(p=>p.department==='central') && <Notice>Your account has no active central staff management assignment in this tenant.</Notice>}
    {management && access.positions.some(p=>p.department==='central')&&<Button disabled={pending} onClick={()=>void select('central','TENANT_STAFF_MANAGER')}>Open central staff management</Button>}
    <Button variant="secondary" onClick={finish}>Refresh access</Button>
    <Button variant="ghost" onClick={logout}>Sign out</Button>
  </section></main>;
}
