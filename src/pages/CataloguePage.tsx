import { useEffect, useId, useState } from 'react';
import { Building2, ChevronDown, Globe, Layers, MapPin, type LucideIcon } from 'lucide-react';
import { Button, EmptyState, Notice, Pagination, Panel } from '../components/UI';
import { CataloguePricePreview } from './CataloguePricePreview';
import { findCatalogueBrandTile, findCatalogueBrandImage } from './catalogue-brand-logos';
import './catalogue.css';
import './catalogue-flags.css';
import './catalogue-brand-logos.css';

const groups = [
  ['GCC','GCC'], ['OTHER_ASIA','Asia'], ['AFRICA','Africa'], ['EUROPE','Europe'],
] as const;
type View = 'countries' | 'services' | 'providers' | 'products' | 'offers' | 'economics' | 'drafts' | 'publications' | 'discoveries' | 'discovery-providers';
interface SourceMarket {id:string;name:string;region:string;}
interface CatalogueRow {
  id: string;
  name?: string;
  brand?: string;
  configured?: boolean;
  group?: string;
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
  sourceId?: string;
  sourceCountry?: string;
  sourceCountryName?: string;
  sourceCountryCode?: string|null;
  sourceRegion?: string;
  productType?: string;
  hasDiscoveries?: boolean;
  pricingReview?: {state:'AWAITING_VERIFIED_TERMS';salePrice:null;mappingStatus?:'PROPOSED'|'APPROVED'|'REJECTED'|null};
  coverageScope?: string|null;
  sellingPricePreview?: string;
  imageUrl?: string;
  denominations?: readonly string[];
  layer1Prices?: Layer1Price[] | null;
  currency?: string;
  category?: string;
  delivery?: string;
  observedAt?: string;
  reviewReason?: 'OUTSIDE_PRICED_CATALOGUE_SCOPE' | 'CANONICAL_MAPPING_REQUIRED';
  mappingBlockers?: readonly string[];
  minAmount?: string;
  maxAmount?: string;
  providerCost?: string;
  serviceFee?: string;
  paymentFee?: string;
  commission?: string;
  margin?: string;
}

type PageKind = 'loading'|'ready'|'unavailable'|'forbidden'|'expired'|'stale';
interface CataloguePageState {
  requestKey:string;
  rows:CatalogueRow[];
  kind:PageKind;
  next:string|null;
  previous:string|null;
  count:number;
  hasConfiguredServices?:boolean;
  pricingPreviewAvailable?:boolean;
  cataloguePartial?:boolean;
}

const idlePage = (requestKey:string,kind:PageKind='loading'):CataloguePageState =>
  ({requestKey,rows:[],kind,next:null,previous:null,count:0});
const isCursor=(value:unknown):value is string|null => value===null || typeof value==='string'&&/^[0-9a-f]{64}$/.test(value);
const emptyFacets={markets:[] as SourceMarket[],productTypes:[] as string[]};
const observedDateTime=new Intl.DateTimeFormat('en-GB',{
  day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'Asia/Dubai',
});

function useCatalogue(view: View, enabled: boolean, filters: Readonly<Record<string,string>>, limit=20, revision=0) {
  const query = new URLSearchParams({ ...filters, limit:String(limit) }).toString();
  const [page,setPage]=useState<{query:string;cursor:string;number:number}>();
  const [state,setState]=useState<CataloguePageState>(()=>idlePage(''));
  const [facets,setFacets]=useState<{provider:string|undefined;markets:SourceMarket[];productTypes:string[]}>();
  const [attempt,setAttempt]=useState(0);
  const currentPage=page?.query===query ? page : undefined;
  const cursor=currentPage?.cursor;
  const provider=filters['provider'];
  const requestKey=JSON.stringify([query,cursor,attempt,revision]);
  useEffect(()=>setPage(undefined),[query,enabled]);
  useEffect(()=>{
    setState(idlePage(requestKey));
    if (!enabled) return;
    const controller = new AbortController();
    void (async()=>{
      try {
        const search=new URLSearchParams(query);
        if (cursor) search.set('cursor',cursor);
        const response = await fetch(`/staff-api/catalogue/${view}?${search}`, {
          credentials:'same-origin', cache:'no-store', signal:controller.signal,
        });
        if (response.status===403 || response.status===401 || response.status===409 && cursor) {
          if (!controller.signal.aborted) {
            setState(idlePage(requestKey,response.status===401?'expired':response.status===403?'forbidden':'stale'));
            if(response.status!==409)setFacets(undefined);
          }
          return;
        }
        if (!response.ok) throw new Error('Catalogue unavailable');
        const data:unknown = await response.json();
        if (!data || typeof data !== 'object' || !('items' in data) || !Array.isArray(data.items) || data.items.length>limit ||
            !('next' in data) || !isCursor(data.next) || !('previous' in data) || !isCursor(data.previous) ||
            !('count' in data) || typeof data.count!=='number' || !Number.isSafeInteger(data.count) || data.count<data.items.length ||
            data.items.some(row=>!row || typeof row!=='object' || typeof row.id!=='string' ||
              row.name!==undefined && typeof row.name!=='string')) throw new Error('Catalogue unavailable');
        if (!controller.signal.aborted) {
          if (view==='discoveries' && 'sourceMarkets' in data && Array.isArray(data.sourceMarkets) &&
              data.sourceMarkets.every(market=>market&&/^[A-Z]{3}$/.test(market.id)&&typeof market.name==='string'&&typeof market.region==='string') &&
              'productTypes' in data && Array.isArray(data.productTypes) && data.productTypes.every(type=>typeof type==='string')) {
            setFacets({provider,markets:data.sourceMarkets,productTypes:data.productTypes});
          }
          const hasConfiguredServices='hasConfiguredServices' in data&&data.hasConfiguredServices===false?false:undefined;
          setState({requestKey,kind:'ready',next:data.next,previous:data.previous,count:data.count,rows:data.items as CatalogueRow[],
            ...('catalogueCoverage' in data && data.catalogueCoverage==='PARTIAL' && {cataloguePartial:true}),
            ...('pricingPreviewAvailable' in data&&data.pricingPreviewAvailable===true&&{pricingPreviewAvailable:true}),
            ...(hasConfiguredServices===false&&{hasConfiguredServices})});
        }
      } catch {
        if (!controller.signal.aborted) setState(idlePage(requestKey,'unavailable'));
      }
    })();
    return ()=>controller.abort();
  },[enabled,query,view,cursor,requestKey,limit,provider]);
  const current=state.requestKey===requestKey && enabled ? state : idlePage(requestKey);
  const number=currentPage?.number??1;
  return {...current,facets:facets?.provider===provider&&facets?facets:emptyFacets,number,totalPages:Math.max(1,Math.ceil(current.count/limit)),
    change:(target:number)=>{
      const token=target===number+1?current.next:target===number-1?current.previous:null;
      if (current.kind==='ready'&&token)setPage({query,cursor:token,number:target});
    },
    restart:()=>{setPage(undefined);setAttempt(value=>value+1);}};
}

function PageControls({label,state}:{label:string;state:ReturnType<typeof useCatalogue>}) {
  if (state.kind==='stale') return <Notice>Results changed or this page expired. <Button variant="secondary" onClick={state.restart}>Start again</Button></Notice>;
  if (state.kind!=='ready'||state.count===0) return null;
  return <nav aria-label={`${label} pagination`} className="table-footer catalogue-pagination">
    <Pagination page={state.number} totalPages={state.totalPages} total={state.count} onChange={state.change}/>
  </nav>;
}

function CatalogueNotice({kind}:{kind:PageKind}) {
  if (kind==='loading') return <p role="status">Loading…</p>;
  if (kind==='forbidden') return <Notice tone="warning">Your current access does not permit this view.</Notice>;
  if (kind==='expired') return <Notice tone="warning">Your session expired. Sign in again.</Notice>;
  return kind==='unavailable'?<Notice tone="warning">Catalogue data is temporarily unavailable.</Notice>:null;
}

function SelectCatalogue({label,value,rows,onChange,placeholder,icon:Icon=Layers,disabled=false}:{label:string;value:string;rows:CatalogueRow[];
  onChange:(value:string)=>void;placeholder?:string;icon?:LucideIcon;disabled?:boolean}) {
  const id=useId();
  return <div className="form-field"><label htmlFor={id}>{label}</label>
    <div className="catalogue-select">
      <Icon className="catalogue-select-icon" size={17} aria-hidden="true"/>
    <select id={id} value={value} disabled={disabled} onChange={event=>onChange(event.target.value)}>
      <option value="">{placeholder??`Select ${label.toLowerCase()}`}</option>
      {rows.map(row=><option key={row.id} value={row.id}>{row.name??row.id}{row.configured===false?' (no configured services)':''}</option>)}
    </select>
      <ChevronDown className="catalogue-select-chevron" size={16} aria-hidden="true"/>
    </div>
  </div>;
}

function Results({title,state,pricing=false}:{title:string;state:ReturnType<typeof useCatalogue>;pricing?:boolean}) {
  return <Panel title={title}>
    <CatalogueNotice kind={state.kind}/>
    {state.kind==='ready' && state.rows.length===0 && <p>{pricing?'No price draft is available for this product.':'No results for the current selection.'}</p>}
    {state.kind==='ready' && state.rows.length>0 && <ul>{state.rows.map(row=><li key={row.id}>
      <strong>{row.action==='ACTIVATE' ? 'Activation' : row.action==='ROLLBACK' ? 'Rollback' : row.name??row.providerId??row.id}</strong>
      <div>
        {typeof row.total==='string' && <span>{pricing?'Draft total':'Total'} {row.total} AED</span>}
        {typeof row.providerCost==='string' && <span> · Provider cost {row.providerCost} AED</span>}
        {typeof row.serviceFee==='string' && <span> · Service fee {row.serviceFee} AED</span>}
        {typeof row.paymentFee==='string' && <span> · Payment fee {row.paymentFee} AED</span>}
        {typeof row.commission==='string' && <span> · Commission {row.commission} AED</span>}
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
    <PageControls label={title} state={state}/>
  </Panel>;
}

interface Layer1Price {
  basis: 'CUSTOMER_PRICE' | 'DENOMINATION' | 'FACE_MIN' | 'FACE_MAX';
  sourceKey: string;
  sourceAmount: string;
  sourceCurrency: string;
  convertedAed: string | null;
  rateSource: 'XE' | 'CURRENCY_API' | 'AED_IDENTITY' | null;
}

function Layer1Prices({ row }: { row: CatalogueRow }) {
  const prices = row.layer1Prices ?? [];
  const customer = prices.filter(price => price.basis === 'CUSTOMER_PRICE');
  const denominations = prices.filter(price => price.basis !== 'CUSTOMER_PRICE');
  const rows = customer.length ? customer : denominations;
  return <div className="catalogue-card-acquisition">
    {row.layer1Prices === null ? <p className="catalogue-card-detail">Provider prices temporarily unavailable.</p> : <>
    {!customer.length && <p className="catalogue-card-detail">Finxplor has not supplied a customer price.</p>}
    {rows.length > 0 && <table className="catalogue-layer1-prices">
      <thead><tr><th>{customer.length ? 'Provider customer price' : 'Provider face value'}</th>
        <th>{customer.length ? 'Converted AED price' : 'Converted AED face value'}</th></tr></thead>
      <tbody>{rows.map(price => <tr key={price.sourceKey}>
        <td>{price.basis === 'FACE_MIN' ? 'From ' : price.basis === 'FACE_MAX' ? 'Up to ' : ''}
          {price.sourceAmount} {price.sourceCurrency}</td>
        <td>{price.convertedAed === null ? 'Awaiting exchange rate' : <>AED {price.convertedAed}
          {price.rateSource === 'CURRENCY_API' && <small> Currency API</small>}
          {price.rateSource === 'XE' && <small> XE</small>}</>}</td>
      </tr>)}</tbody>
    </table>}
    </>}
  </div>;
}

function DiscoveryCard({row,preview}:{row:CatalogueRow;preview?:()=>void}) {
  const kind=row.productType??row.category;
  const brand=(typeof row.brand==='string'?row.brand.trim():'')||row.providerId;
  const brandTile=brand ? findCatalogueBrandTile(brand) : undefined;
  const brandImage=brand ? findCatalogueBrandImage(brand) : undefined;
  const [failedArtwork,setFailedArtwork]=useState<string>();
  const providerArtwork=row.imageUrl && row.imageUrl!==failedArtwork ? row.imageUrl : undefined;
  const market=row.sourceCountryName??row.sourceCountry;
  const countryCode=row.sourceCountryCode?.toLowerCase();
  const hasFlag=countryCode!==undefined&&/^[a-z]{2}$/.test(countryCode);
  const discoveryOnly=row.reviewReason==='OUTSIDE_PRICED_CATALOGUE_SCOPE';
  const mappingStatus=row.pricingReview?.mappingStatus;
  const ipay = row.providerId==='IPAY';
  const providerAmountUnavailable = (row.providerId==='FINXPLOR' || ipay) &&
    [row.minAmount,row.maxAmount,...(Array.isArray(row.denominations) ? row.denominations : [])].every(value=>
      typeof value==='string' && /^0(?:\.0+)?$/.test(value));
  const sellingPrice=typeof row.sellingPricePreview==='string'&&/^(?:0|[1-9][0-9]{0,6})\.[0-9]{2}$/.test(row.sellingPricePreview)
    ? row.sellingPricePreview : undefined;
  const blockers=Array.isArray(row.mappingBlockers)?row.mappingBlockers:[];
  const mappingDetails=[
    blockers.includes('SERVICE_COUNTRY')?market:null,
    blockers.includes('CURRENCY')?row.currency:null,
    blockers.includes('PRODUCT_TYPE')?kind:null,
  ].filter(Boolean).join(' · ');
  return <li className="catalogue-product-card">
    <div className="catalogue-card-header">
      <div className="catalogue-card-brand">
        {brandImage&&<img className="catalogue-company-image" src={brandImage} alt={`${brand} logo`} width={48} height={40}/> }
        {!brandImage&&brandTile&&<span className={`catalogue-brand-logo catalogue-brand-logo--${brandTile}`}>
          <img src="/catalogue-brand-logos.png" alt="" draggable={false}/>
        </span>}
        {!brandImage && !brandTile && providerArtwork && <img className="catalogue-company-image" src={providerArtwork}
          alt={`${brand} artwork`} width={48} height={40} loading="lazy" referrerPolicy="no-referrer"
          onError={()=>setFailedArtwork(providerArtwork)}/>}
        {brand&&<strong>{brand}</strong>}
      </div>
      <span className={hasFlag?`catalogue-flag catalogue-flag--${countryCode}`:'catalogue-flag'} aria-hidden="true">
        {hasFlag?<img src="/catalogue-country-flags.png" alt="" draggable={false}/>:<Globe size={18}/>}
      </span>
    </div>
    <div>
      <p className="catalogue-product-type">{kind}</p>
      <h3>{row.name??row.sourceId}</h3>
      <p className="catalogue-card-detail">{[market,row.sourceRegion,row.sourceId].filter(Boolean).join(' · ')}</p>
    </div>
    <dl className="catalogue-card-prices">
      <div>
        <dt className="catalogue-card-detail">Provider denomination</dt>
        <dd className="catalogue-amount catalogue-card-denomination">
          {providerAmountUnavailable ? 'Amount required' : ipay && row.denominations?.length ? row.denominations.join(', ') :
            row.minAmount===row.maxAmount?row.maxAmount:`${row.minAmount}–${row.maxAmount}`} {row.currency}
        </dd>
      </div>
      {row.providerId!=='FINXPLOR'&&!ipay&&<div>
        <dt className="catalogue-card-detail">Selling price</dt>
        {sellingPrice ? <dd className="catalogue-card-selling-price">
          <span className="catalogue-amount catalogue-card-denomination">AED {sellingPrice}</span>
          <span className="catalogue-card-detail">Demo estimate</span>
        </dd> : <dd className="catalogue-card-price-pending">Cost data required</dd>}
      </div>}
    </dl>
    <div className="catalogue-card-review">
      <span className={`badge badge--${discoveryOnly?'neutral':'warning'}`}>{discoveryOnly?'Discovery only':
        mappingStatus==='APPROVED'?'Mapping approved':'Mapping review required'}</span>
      {discoveryOnly&&mappingDetails&&<p className="catalogue-card-detail">Outside priced coverage for {mappingDetails}</p>}
      {!discoveryOnly&&row.pricingReview?.state==='AWAITING_VERIFIED_TERMS'&&<details>
        <summary>Pricing review</summary>
        <ul>
          <li>{row.coverageScope==='ALL_COUNTRIES'?'Verified account catalogue':
            row.coverageScope==='ARE_GIFT_CARD'?'Verified UAE gift-card listing':'Coverage awaits verification'}</li>
          <li>{mappingStatus==='APPROVED'?'Canonical mapping approved':mappingStatus==='PROPOSED'?'Mapping awaiting approval':
            mappingStatus==='REJECTED'?'Canonical mapping rejected':'Canonical match required'}</li>
          <li>Verified provider debit and fees required</li>
          <li>Approved pricing policy required before drafting</li>
        </ul>
      </details>}
    </div>
    {row.providerId==='FINXPLOR'&&<Layer1Prices row={row}/>}
    {row.observedAt&&Number.isFinite(Date.parse(row.observedAt))&&<p className="catalogue-card-observed">Observed <time dateTime={row.observedAt}>
      {observedDateTime.format(new Date(row.observedAt))}</time> Dubai</p>}
    {row.providerId!=='FINXPLOR'&&!ipay&&preview&&sellingPrice&&<Button variant="secondary" onClick={preview}>Preview AED price</Button>}
  </li>;
}

export function CataloguePage({csrfToken,fxRevision=0,canSyncIpayCatalogue=false}:
  {csrfToken:string;fxRevision?:number;canSyncIpayCatalogue?:boolean}) {
  const [group,setGroup] = useState('GCC');
  const [syncing,setSyncing]=useState<'finxplor'|'ipay'|null>(null);
  const [syncMessage,setSyncMessage]=useState('');
  async function syncCatalogue(provider:'finxplor'|'ipay') {
    if(syncing)return;
    setSyncing(provider);
    setSyncMessage(provider==='ipay'?'Syncing iPay products…':'Syncing every country from Finxplor…');
    try {
      const response=await fetch(provider==='ipay'?'/staff-api/catalogue/sync-ipay':'/staff-api/catalogue/sync',{method:'POST',credentials:'same-origin',
        headers:{'x-csrf-token':csrfToken??''}});
      const result=await response.json();
      if(!response.ok || result.persisted!==true)throw new Error();
      const catalogue = `Saved ${result.products} products to PostgreSQL (${result.inserted} new, ${result.unchanged} unchanged).`;
      const layer1 = result.layer1===null ? ' Layer 1 refresh is pending.' : result.layer1
        ? ` Layer 1 saved ${result.layer1.amounts} amounts. ${result.layer1.pendingFx} await an exchange rate.` : '';
      const progress = result.verificationMismatch===true
        ? ' Finxplor returned different products on the verification pass. The catalogue includes both results.'
        : Number.isSafeInteger(result.nextPage)
        ? result.verificationPending===true
          ? ` Finxplor reached the final page. Another sync resumes verification at page ${result.nextPage}.`
          : ` Finxplor coverage is incomplete. Another sync resumes at page ${result.nextPage}.`
        : '';
      setSyncMessage(catalogue+layer1+progress);
      discoveryProviders.restart();discoveries.restart();
    } catch {setSyncMessage('Sync failed. Existing saved products are retained. Check the server sync receipt.');}
    finally {setSyncing(null);}
  }
  const [country,setCountry] = useState('');
  const [service,setService] = useState('');
  const [provider,setProvider] = useState('');
  const [product,setProduct] = useState('');
  const [searchText,setSearchText]=useState('');
  const [search,setSearch]=useState('');
  const [compareProviders,setCompareProviders]=useState(false);
  const [discoverySearch,setDiscoverySearch]=useState('');
  const [discoveryFilter,setDiscoveryFilter]=useState('');
  const [chosenDiscoveryProvider,setDiscoveryProvider]=useState<string>();
  const [sourceRegion,setSourceRegion]=useState('');
  const [sourceCountry,setSourceCountry]=useState('');
  const [productType,setProductType]=useState('');
  const [pageSize,setPageSize]=useState(20);
  const [preview,setPreview]=useState<CatalogueRow>();
  const discoveryProviders = useCatalogue('discovery-providers',true,{sort:'name'},50);
  const discoveryProvider = chosenDiscoveryProvider ?? discoveryProviders.rows.find(row=>row.hasDiscoveries)?.id ?? '';
  const discoveries = useCatalogue('discoveries',Boolean(discoveryProvider),{provider:discoveryProvider,sort:'name',
    ...(discoveryFilter&&{search:discoveryFilter}),...(sourceRegion&&{sourceRegion}),...(sourceCountry&&{sourceCountry}),
    ...(productType&&{productType})},pageSize,fxRevision);
  const providerRegions=[...new Set(discoveries.facets.markets.map(market=>market.region))].sort();
  const providerMarkets=discoveries.facets.markets.filter(market=>!sourceRegion||market.region===sourceRegion);
  const countries = useCatalogue('countries',discoveryProviders.kind==='ready'&&discoveryProviders.hasConfiguredServices!==false,{sort:'name'},50);
  const showMasterCatalogue=countries.kind==='ready'&&countries.rows.some(row=>row.configured===true);
  const regionalCountries=countries.rows.filter(row=>row.group===group);
  const selectedCountry=regionalCountries.find(row=>row.id===country);
  const services = useCatalogue('services',Boolean(selectedCountry?.configured),{country});
  const providers = useCatalogue('providers',Boolean(country&&service),{country,service});
  const products = useCatalogue('products',Boolean(country&&service&&provider),{country,service,provider,...(search && {search})});
  const offers = useCatalogue('offers',Boolean(product),{country,service,product,...(!compareProviders && {provider})});
  const economics = useCatalogue('economics',Boolean(product),{country,service,provider,product});
  const drafts = useCatalogue('drafts',Boolean(product),{product});
  const publications = useCatalogue('publications',Boolean(product),{product});
  return <div className="catalogue-layout">
    <Panel title="Provider discoveries" subtitle="Imported products awaiting review. Denominations are reported by the provider.">
      <div className="catalogue-discovery-tools">
        {discoveryProvider==='IPAY' ? canSyncIpayCatalogue &&
          <Button type="button" disabled={Boolean(syncing)||!csrfToken} onClick={()=>void syncCatalogue('ipay')}>
            {syncing==='ipay'?'Syncing…':'Sync iPay products'}
          </Button> : <Button type="button" disabled={Boolean(syncing)||!csrfToken} onClick={()=>void syncCatalogue('finxplor')}>
            {syncing==='finxplor'?'Syncing…':'Sync all Finxplor products'}
          </Button>}
        <p role="status" aria-live="polite">{syncMessage}</p>
      </div>
      <div className="catalogue-discovery-filters catalogue-filters">
        <SelectCatalogue label="Provider" icon={Building2} value={discoveryProvider} disabled={discoveryProviders.kind!=='ready'||!discoveryProviders.rows.length}
          rows={discoveryProviders.rows.map(row=>({...row,name:row.hasDiscoveries ? row.name??row.id : `${row.name??row.id} (no imports)`}))}
          onChange={value=>{setDiscoveryProvider(value);setSourceRegion('');setSourceCountry('');setProductType('');
            setDiscoverySearch('');setDiscoveryFilter('');discoveries.restart();}}/>
        <SelectCatalogue label="Source region" icon={Globe} placeholder="All regions" value={sourceRegion}
          disabled={!providerRegions.length} rows={providerRegions.map(id=>({id}))}
          onChange={value=>{setSourceRegion(value);setSourceCountry('');}}/>
        <SelectCatalogue label="Source country" icon={MapPin} placeholder="All countries" value={sourceCountry}
          disabled={!providerMarkets.length} rows={providerMarkets.map(market=>({id:market.id,name:`${market.name} (${market.id})`}))}
          onChange={setSourceCountry}/>
        <SelectCatalogue label="Product type" placeholder="All product types" value={productType}
          disabled={!discoveries.facets.productTypes.length} rows={discoveries.facets.productTypes.map(id=>({id}))}
          onChange={setProductType}/>
      </div>
      <CatalogueNotice kind={discoveryProviders.kind}/>
      {(discoveryProviders.totalPages>1||discoveryProviders.kind==='stale')&&<PageControls label="Discovery providers" state={discoveryProviders}/>}
      {discoveryProviders.kind==='ready'&&!discoveryProviders.rows.length&&<Notice>No providers are configured for discovery browsing.</Notice>}
      {!discoveryProvider && discoveryProviders.rows.length>0 && <Notice>Select a provider to browse its imported products.</Notice>}
      {discoveryProvider && <>
      <form className="catalogue-discovery-tools" onSubmit={event=>{event.preventDefault();discoveries.restart();setDiscoveryFilter(discoverySearch.trim());}}>
        <div className="form-field"><label htmlFor="provider-discovery-search">Search provider products</label>
        <input id="provider-discovery-search" maxLength={128} value={discoverySearch} placeholder="Product, provider or source ID"
          onChange={event=>setDiscoverySearch(event.target.value)}/></div>
        <Button type="submit">Find provider products</Button>
        <div className="form-field"><label htmlFor="discovery-page-size">Rows per page</label>
          <select id="discovery-page-size" value={pageSize} onChange={event=>setPageSize(Number(event.target.value))}>
            {[10,20,50].map(size=><option key={size} value={size}>{size}</option>)}
          </select>
        </div>
      </form>
      <CatalogueNotice kind={discoveries.kind}/>
      {discoveries.kind==='ready' && (discoveries.rows.length?
        <ul className="catalogue-product-grid" aria-label="Imported products">{discoveries.rows.map(row=><DiscoveryCard key={row.id} row={row}
          {...(discoveryProviders.pricingPreviewAvailable&&{preview:()=>setPreview(row)})}/>)}</ul>:
        <EmptyState title="No products found" description={discoveryFilter||sourceCountry||sourceRegion||productType?
          'No provider products match your filters.':'No products have been imported for this provider.'}/>)}
      {discoveries.cataloguePartial && <Notice tone="warning">
        This catalogue includes the Finxplor products received so far. Full account coverage awaits a confirmed final page.
      </Notice>}
      <PageControls label="Provider discoveries" state={discoveries}/>
      </>}
    </Panel>
    {preview&&discoveryProviders.pricingPreviewAvailable&&<CataloguePricePreview product={preview.name??preview.sourceId??preview.id}
      discoveryId={preview.id} csrfToken={csrfToken} close={()=>setPreview(undefined)}/>}
    {showMasterCatalogue && <Panel title="Master catalogue" subtitle="Browse configured services and canonical products by country.">
      <div className="catalogue-filters">
        <SelectCatalogue label="Region" icon={Globe} value={group} rows={groups.map(([id,name])=>({id,name}))}
          onChange={value=>{setGroup(value||'GCC');setCountry('');setService('');setProvider('');setProduct('');}}/>
        <SelectCatalogue label="Country" icon={MapPin} value={country} rows={regionalCountries}
          onChange={value=>{setCountry(value);setService('');setProvider('');setProduct('');}}/>
        {selectedCountry?.configured && <SelectCatalogue label="Service" value={service} rows={services.rows} disabled={services.kind!=='ready'||!services.rows.length}
          onChange={value=>{setService(value);setProvider('');setProduct('');}}/>}
        {service && <SelectCatalogue label="Catalogue provider" icon={Building2} value={provider} rows={providers.rows} disabled={providers.kind!=='ready'||!providers.rows.length}
          onChange={value=>{setProvider(value);setProduct('');setSearch('');setSearchText('');setCompareProviders(false);}}/>}
      </div>
      {selectedCountry?.configured===false && <Notice>{selectedCountry.name} has no configured catalogue services. Browse imported products under Provider discoveries.</Notice>}
      {selectedCountry?.configured && <><CatalogueNotice kind={services.kind}/>
        {services.kind==='ready'&&!services.rows.length&&<Notice>No catalogue services are currently available for this country.</Notice>}
        {(services.totalPages>1||services.kind==='stale')&&<PageControls label="Services" state={{...services,change:target=>{
          setService('');setProvider('');setProduct('');services.change(target);
        }}}/>}</>}
      {service && <><CatalogueNotice kind={providers.kind}/>
        {providers.kind==='ready'&&!providers.rows.length&&<Notice>No providers are configured for this service.</Notice>}
        {(providers.totalPages>1||providers.kind==='stale')&&<PageControls label="Providers" state={{...providers,change:target=>{
          setProvider('');setProduct('');providers.change(target);
        }}}/>}</>}
      {provider && <>
        <form className="catalogue-product-tools" onSubmit={event=>{event.preventDefault();setProduct('');products.restart();setSearch(searchText.trim());}}>
          <div className="form-field"><label htmlFor="catalogue-product-search">Search products</label>
          <input id="catalogue-product-search" maxLength={128} value={searchText} onChange={event=>setSearchText(event.target.value)}/></div>
          <Button type="submit" variant="secondary">Search</Button>
        </form>
        <SelectCatalogue label="Product" value={product} rows={products.rows} onChange={setProduct} disabled={products.kind!=='ready'||!products.rows.length}/>
        <CatalogueNotice kind={products.kind}/><PageControls label="Products" state={{...products,change:target=>{setProduct('');products.change(target);}}}/>
        {products.kind==='ready'&&!products.rows.length&&<p>No products match this selection.</p>}
      </>}
    </Panel>}
    {showMasterCatalogue && product && <>
      <label><input type="checkbox" checked={compareProviders} onChange={event=>setCompareProviders(event.target.checked)}/>
        Compare offers from all providers</label>
      <Results title="Provider offers" state={offers}/>
      <Results title="Pricing" state={economics} pricing/>
      <Results title="Draft and publication status" state={drafts}/>
      <Results title="Publication history" state={publications}/>
    </>}
  </div>;
}
