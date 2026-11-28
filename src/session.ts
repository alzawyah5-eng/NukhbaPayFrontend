import { validDepartmentAccess, type DepartmentAccess } from './department.js';
export type SessionState =
  | { kind: 'loading' | 'anonymous' | 'unavailable' | 'forbidden' }
  | { kind: 'authenticated'; csrfToken: string; profile: StaffProfile };

export const workspacePaths=['/overview','/staff','/staff/invite','/roles','/departments','/access-requests',
  '/security','/sessions','/audit','/reports','/settings','/catalogue','/staff/commands','/catalogue/publication'] as const;
export type WorkspacePath=typeof workspacePaths[number];

export interface StaffProfile {
  readonly staffId:string; readonly tenantId:string|null; readonly expiresAtMs:number;
  readonly navigation: readonly WorkspacePath[];
  readonly departmentAccess?:DepartmentAccess;
  readonly canRefreshFxRates?:true;
}

export async function readLoginConfig(signal?:AbortSignal):Promise<{path:'/auth/login';departmentLogin:boolean}|undefined> {
  try {
    const response=await fetch('/auth/config',{credentials:'same-origin',cache:'no-store',signal:signal??null});
    if(!response.ok)return undefined;
    const data:unknown=await response.json();
    if(!data||typeof data!=='object'||Array.isArray(data)||!('loginPath' in data)||data.loginPath!=='/auth/login')return undefined;
    if(Object.keys(data).length===1)return {path:'/auth/login',departmentLogin:false};
    if(Object.keys(data).length===2 && 'departmentLogin' in data && data.departmentLogin===true)return {path:'/auth/login',departmentLogin:true};
    return undefined;
  }catch{return undefined;}
}
export async function readLoginPath(signal?:AbortSignal){return (await readLoginConfig(signal))?.path;}

// Only the existing same-origin BFF is contacted. Cookies are HttpOnly; CSRF stays in memory.
export async function readSession(signal?: AbortSignal): Promise<SessionState> {
  try {
    const response = await fetch('/auth/workspace', {
      credentials: 'same-origin', cache: 'no-store', signal: signal ?? null,
    });
    if (response.status === 401) return { kind: 'anonymous' };
    if (response.status === 403) return { kind: 'forbidden' };
    if (!response.ok) return { kind: 'unavailable' };
    const data: unknown = await response.json();
    if (typeof data === 'object' && data !== null && !Array.isArray(data) &&
      ['csrfToken,expiresAtMs,navigation,staffId,tenantId','csrfToken,departmentAccess,expiresAtMs,navigation,staffId,tenantId'].includes(Object.keys(data).filter(key=>key!=='canRefreshFxRates').sort().join(','))) {
      const {csrfToken,staffId,tenantId,expiresAtMs,navigation,departmentAccess,canRefreshFxRates}=data as Record<string,unknown>;
      const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if(typeof csrfToken==='string' && /^[A-Za-z0-9_-]{43}$/.test(csrfToken) &&
        typeof staffId==='string' && uuid.test(staffId) &&
        (tenantId===null||typeof tenantId==='string'&&uuid.test(tenantId)) &&
        typeof expiresAtMs==='number' && Number.isSafeInteger(expiresAtMs) && expiresAtMs>0 &&
        Number.isFinite(new Date(expiresAtMs).getTime()) &&
        Array.isArray(navigation) && navigation[0]==='/overview' &&
        navigation.length<=workspacePaths.length && new Set(navigation).size===navigation.length &&
        navigation.slice(1).every(item=>tenantId!==null && workspacePaths.includes(item)) &&
        (canRefreshFxRates===undefined || canRefreshFxRates===true && navigation.includes('/catalogue')) &&
        (departmentAccess===undefined || (!!tenantId && validDepartmentAccess(departmentAccess)))) {
        return {kind:'authenticated',csrfToken,profile:{staffId,tenantId,expiresAtMs,navigation,
          ...(departmentAccess&&{departmentAccess}),...(canRefreshFxRates===true&&{canRefreshFxRates})}};
      }
    }
  } catch { /* Render a safe retry state, never a fabricated session. */ }
  return { kind: 'unavailable' };
}

export function sessionExpiryDelay(expiresAtMs:number,now=Date.now()):number {
  return Math.max(0,Math.min(expiresAtMs-now,2_147_483_647));
}

/** The allowlist comes from server-rendered HTML configuration, never logout JSON. */
export function providerLogoutDestination(value:unknown,expected:string|undefined,origin:string):string|undefined {
  if(typeof value!=='string'||!expected||value!==expected)return undefined;
  try {
    const url=new URL(value);
    if(url.href!==value||url.protocol!=='https:'||url.username||url.password||url.port||url.hash||url.pathname!=='/v2/logout' ||
      new URL(origin).origin!==origin||url.searchParams.getAll('client_id').length!==1||!url.searchParams.get('client_id')||
      url.searchParams.getAll('returnTo').length!==1||url.searchParams.get('returnTo')!==origin+'/auth/logged-out'||
      [...url.searchParams.keys()].some(key=>key!=='client_id'&&key!=='returnTo'))return undefined;
    return value;
  }catch{return undefined;}
}

export function serverLogoutPolicy(document:Pick<Document,'querySelectorAll'>):string|undefined {
  const entries=document.querySelectorAll('meta[name="nukhbapay-provider-logout"]');
  return entries.length===1?entries[0]?.getAttribute('content')??undefined:undefined;
}

export type LogoutResult={readonly ok:true;readonly destination:string}|{readonly ok:false};
export async function signOut(csrfToken: string,expectedProviderUrl?:string,origin?:string): Promise<LogoutResult> {
  try {
    const response = await fetch('/auth/logout', {
      method: 'POST', credentials: 'same-origin', cache: 'no-store',
      headers: { 'content-type': 'application/json', 'x-csrf-token': csrfToken }, body: '{}',
    });
    if(response.status===204)return {ok:true,destination:'/auth/logged-out'};
    if(response.status!==200||!expectedProviderUrl||!origin)return {ok:false};
    const data:unknown=await response.json();
    if(!data||typeof data!=='object'||Array.isArray(data)||Object.keys(data).length!==1||!('logoutUrl' in data))return {ok:false};
    const destination=providerLogoutDestination(data.logoutUrl,expectedProviderUrl,origin);
    return destination?{ok:true,destination}:{ok:false};
  } catch { return {ok:false}; }
}
