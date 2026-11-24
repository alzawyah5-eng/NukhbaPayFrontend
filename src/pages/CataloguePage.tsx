import { useEffect, useState } from 'react';
import { Button, Notice, Panel } from '../components/UI';

const groups = [
  ['GCC','GCC'], ['OTHER_ASIA','Asia'], ['AFRICA','Africa'], ['EUROPE','Europe'],
] as const;
type View = 'countries' | 'services' | 'providers' | 'products' | 'offers' | 'economics' | 'drafts' | 'publications';
interface CatalogueRow {
  id: string;
  name?: string;
  configured?: boolean;
  available?: boolean;
  total?: string;
  status?: string;
  version?: number;
  revision?: string;
  action?: 'ACTIVATE'|'ROLLBACK';
  occurredAt?: string;
  validUntil?: string;
  freshness?: 'CURRENT'|'EXPIRED';
  sourceObservedAt?: string;
  sourceCompletedAt?: string;
  providerId?: string;
  providerCost?: string;
  margin?: string;
}

type PageKind = 'loading'|'ready'|'unavailable'|'forbidden'|'expired';
interface CataloguePageState {
  query:string;
  rows:CatalogueRow[];
  kind:PageKind;
  next:string|null;
}

function useCatalogue(view: View, enabled: boolean, filters: Readonly<Record<string,string>>) {
  const query = new URLSearchParams({ ...filters, limit:'20' }).toString();
  const [page,setPage]=useState<{query:string;cursor:string}>();
  const [state,setState]=useState<CataloguePageState>({query,rows:[],kind:'loading',next:null});
  const cursor=page?.query===query ? page.cursor : undefined;
  useEffect(()=>setPage(undefined),[query,enabled]);
  useEffect(()=>{
    if (!enabled) return;
    const controller = new AbortController();
    setState(previous=>({query,rows:cursor && previous.query===query ? previous.rows : [],kind:'loading',next:null}));
    void (async()=>{
      try {
        const search=new URLSearchParams(query);
        if (cursor) search.set('cursor',cursor);
        const response = await fetch(`/staff-api/catalogue/${view}?${search}`, {
          credentials:'same-origin', cache:'no-store', signal:controller.signal,
        });
        if (response.status===403 || response.status===401) {
          if (!controller.signal.aborted) setState({query,rows:[],kind:response.status===401?'expired':'forbidden',next:null});
          return;
        }
        if (!response.ok) throw new Error('Catalogue unavailable');
        const data:unknown = await response.json();
        if (!data || typeof data !== 'object' || !('items' in data) || !Array.isArray(data.items) || data.items.length>20 ||
            !('next' in data) || data.next!==null && (typeof data.next!=='string'||!/^[0-9a-f]{64}$/.test(data.next)) ||
            data.items.some(row=>!row || typeof row!=='object' || typeof row.id!=='string' ||
              row.name!==undefined && typeof row.name!=='string')) throw new Error('Catalogue unavailable');
        const next=data.next as string|null;
        const items=data.items as CatalogueRow[];
        if (!controller.signal.aborted) setState(previous=>({query,kind:'ready',next,
          rows:[...new Map([...(cursor && previous.query===query?previous.rows:[]),...items].map(row=>[row.id,row])).values()]}));
      } catch {
        if (!controller.signal.aborted) setState({query,rows:[],kind:'unavailable',next:null});
      }
    })();
    return ()=>controller.abort();
  },[enabled,query,view,cursor]);
  const current:CataloguePageState=state.query===query && enabled ? state : {query,rows:[],kind:'loading',next:null};
  return {...current,load:()=>{if (current.kind==='ready'&&current.next)setPage({query,cursor:current.next});}};
}

function More({state}:{state:ReturnType<typeof useCatalogue>}) {
  return state.next ? <Button variant="secondary" onClick={state.load}>Load more</Button> : null;
}

function CatalogueNotice({kind}:{kind:PageKind}) {
  if (kind==='loading') return <p role="status">Loading…</p>;
  if (kind==='forbidden') return <Notice tone="warning">Your current access does not permit this view.</Notice>;
  if (kind==='expired') return <Notice tone="warning">Your session expired. Sign in again.</Notice>;
  return kind==='unavailable'?<Notice tone="warning">Catalogue data is temporarily unavailable.</Notice>:null;
}

function SelectCatalogue({label,value,rows,onChange}:{label:string;value:string;rows:CatalogueRow[];onChange:(value:string)=>void}) {
  return <div className="form-field"><label>{label}
    <select value={value} onChange={event=>onChange(event.target.value)}>
      <option value="">Select {label.toLowerCase()}</option>
      {rows.map(row=><option key={row.id} value={row.id} disabled={row.configured===false}>{row.name??row.id}</option>)}
    </select>
  </label></div>;
}

function Results({title,state}:{title:string;state:ReturnType<typeof useCatalogue>}) {
  return <Panel title={title}>
    <CatalogueNotice kind={state.kind}/>
    {state.kind==='ready' && state.rows.length===0 && <p>No results for the current selection.</p>}
    {state.kind==='ready' && state.rows.length>0 && <ul>{state.rows.map(row=><li key={row.id}>
      <strong>{row.action==='ACTIVATE' ? 'Activation' : row.action==='ROLLBACK' ? 'Rollback' : row.name??row.providerId??row.id}</strong>
      <div>
        {typeof row.total==='string' && <span>Total {row.total} AED</span>}
        {typeof row.providerCost==='string' && <span> · Provider cost {row.providerCost} AED</span>}
        {typeof row.margin==='string' && <span> · Margin {row.margin} AED</span>}
        {row.available!==undefined && <span> · {row.available ? 'Available' : 'Unavailable'}</span>}
        {row.freshness && <span> · {row.freshness==='CURRENT' ? 'Current offer' : 'Expired offer'}</span>}
        {typeof row.sourceObservedAt==='string' && <span> · Observed <time dateTime={row.sourceObservedAt}>{row.sourceObservedAt}</time></span>}
        {typeof row.sourceCompletedAt==='string' && <span> · Snapshot completed <time dateTime={row.sourceCompletedAt}>{row.sourceCompletedAt}</time></span>}
        {typeof row.validUntil==='string' && <span> · Valid until <time dateTime={row.validUntil}>{row.validUntil}</time></span>}
        {typeof row.status==='string' && <span> · {row.status}</span>}
        {typeof row.revision==='string' && <span>Revision {row.revision}</span>}
        {typeof row.occurredAt==='string' && <span> · <time dateTime={row.occurredAt}>{row.occurredAt}</time></span>}
        {typeof row.version==='number' && <span> · Version {row.version}</span>}
      </div>
    </li>)}</ul>}
    <More state={state}/>
  </Panel>;
}

export function CataloguePage() {
  const [group,setGroup] = useState('GCC');
  const [country,setCountry] = useState('');
  const [service,setService] = useState('');
  const [provider,setProvider] = useState('');
  const [product,setProduct] = useState('');
  const [searchText,setSearchText]=useState('');
  const [search,setSearch]=useState('');
  const [compareProviders,setCompareProviders]=useState(false);
  const countries = useCatalogue('countries',true,{group});
  const services = useCatalogue('services',Boolean(country),{country});
  const providers = useCatalogue('providers',Boolean(country&&service),{country,service});
  const products = useCatalogue('products',Boolean(country&&service&&provider),{country,service,provider,...(search && {search})});
  const offers = useCatalogue('offers',Boolean(product),{country,service,product,...(!compareProviders && {provider})});
  const economics = useCatalogue('economics',Boolean(product),{country,service,provider,product});
  const drafts = useCatalogue('drafts',Boolean(product),{product});
  const publications = useCatalogue('publications',Boolean(product),{product});
  return <>
    <Panel title="Master catalogue">
      <SelectCatalogue label="Region" value={group} rows={groups.map(([id,name])=>({id,name}))}
        onChange={value=>{setGroup(value||'GCC');setCountry('');setService('');setProvider('');setProduct('');}}/>
      <SelectCatalogue label="Country" value={country} rows={countries.rows}
        onChange={value=>{setCountry(value);setService('');setProvider('');setProduct('');}}/>
      <CatalogueNotice kind={countries.kind}/><More state={countries}/>
      {country && <><SelectCatalogue label="Service" value={service} rows={services.rows}
        onChange={value=>{setService(value);setProvider('');setProduct('');}}/><CatalogueNotice kind={services.kind}/><More state={services}/></>}
      {service && <><SelectCatalogue label="Provider" value={provider} rows={providers.rows}
        onChange={value=>{setProvider(value);setProduct('');setSearch('');setSearchText('');setCompareProviders(false);}}/><CatalogueNotice kind={providers.kind}/><More state={providers}/></>}
      {provider && <>
        <form onSubmit={event=>{event.preventDefault();setProduct('');setSearch(searchText.trim());}}>
          <div className="form-field"><label htmlFor="catalogue-product-search">Search products</label>
          <input id="catalogue-product-search" maxLength={128} value={searchText} onChange={event=>setSearchText(event.target.value)}/></div>
          <Button type="submit" variant="secondary">Search</Button>
        </form>
        <SelectCatalogue label="Product" value={product} rows={products.rows} onChange={setProduct}/>
        <CatalogueNotice kind={products.kind}/><More state={products}/>
        {products.kind==='ready'&&!products.rows.length&&<p>No products match this selection.</p>}
      </>}
    </Panel>
    {product && <>
      <label><input type="checkbox" checked={compareProviders} onChange={event=>setCompareProviders(event.target.checked)}/>
        Compare offers from all providers</label>
      <Results title="Provider offers" state={offers}/>
      <Results title="Pricing" state={economics}/>
      <Results title="Draft and publication status" state={drafts}/>
      <Results title="Publication history" state={publications}/>
    </>}
  </>;
}
