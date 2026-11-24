export const departments=['operations','catalogue','security','support','finance','compliance'] as const;
export type Department=typeof departments[number];
export type Position={department:Department|'central';role:string};
export type DepartmentAccess={positions:Position[];selected:Position|null};
export const isDepartment=(value:unknown):value is Department=>departments.some(department=>department===value);
export const departmentName=(value:Department)=>value[0].toUpperCase()+value.slice(1);
export const roleName=(value:string)=>value.toLowerCase().split('_').map(word=>word.charAt(0).toUpperCase()+word.slice(1)).join(' ');
function validPosition(value:unknown):value is Position {
  return !!value && typeof value==='object' && Object.keys(value).length===2 && 'department' in value &&
    (isDepartment(value.department) || value.department==='central' && 'role' in value && value.role==='TENANT_STAFF_MANAGER')
    && 'role' in value && typeof value.role==='string' && /^[A-Z][A-Z_0-9]{0,63}$/.test(value.role);
}
export function validDepartmentAccess(value:unknown):value is DepartmentAccess {
  if(!value || typeof value!=='object'||Object.keys(value).length!==2||!('positions' in value) || !('selected' in value) ||
    !Array.isArray(value.positions)||value.positions.length>128||!value.positions.every(validPosition))return false;
  const selected=value.selected;
  return selected===null || (validPosition(selected) &&
    value.positions.some(p=>p.department===selected.department && p.role===selected.role));
}
const key='nukhbapay.department';
export function priorDepartment():Department|'' {
  try {const value=sessionStorage.getItem(key);return isDepartment(value)?value:'';} catch{return '';}
}
export function rememberDepartment(value:Department):void {
  try {sessionStorage.setItem(key,value);} catch { /* Allow selection again after MFA. */ }
}
