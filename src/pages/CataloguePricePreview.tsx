import { useEffect, useId, useRef, useState } from 'react';
import { Button, Notice } from '../components/UI';

type Preview = {
  estimatedCost:string;indicativePrice:string;senderAmount:string;senderCurrency:string;demoAedRate:string;
  platformFee:string;commission:string;
};
const aed = /^(?:0|[1-9][0-9]{0,6})\.[0-9]{2}$/;

export function CataloguePricePreview({product,discoveryId,csrfToken,close}:{product:string;discoveryId:string;csrfToken:string;close:()=>void}) {
  const dialog=useRef<HTMLDialogElement>(null);
  const title=useId();
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [price,setPrice]=useState<Preview>();
  useEffect(()=>{
    const element=dialog.current;
    if(element && !element.open)element.showModal();
    const controller=new AbortController();
    setError('');setPrice(undefined);setBusy(true);
    void (async()=>{
      try {
        const response=await fetch('/staff-api/catalogue/price-preview',{
          method:'POST',credentials:'same-origin',cache:'no-store',signal:controller.signal,
          headers:{'content-type':'application/json','x-csrf-token':csrfToken},
          body:JSON.stringify({discoveryId}),
        });
        if(controller.signal.aborted)return;
        if(response.status===409){setError('Saved sender cost is unavailable for this product.');return;}
        if(!response.ok)throw new Error();
        const result:unknown=await response.json();
        if(!result || typeof result!=='object' || !('basis' in result) || result.basis!=='OBSERVED_SENDER_COST_DEMO_FX' ||
           !('currency' in result) || result.currency!=='AED')throw new Error();
        const {estimatedCost,platformFee,commission,indicativePrice,senderAmount,senderCurrency,demoAedRate}=
          result as Record<string,unknown>;
        if(typeof estimatedCost!=='string'||!aed.test(estimatedCost) || typeof indicativePrice!=='string'||!aed.test(indicativePrice) ||
           typeof platformFee!=='string'||!aed.test(platformFee) || typeof commission!=='string'||!aed.test(commission) ||
           typeof senderAmount!=='string'||typeof senderCurrency!=='string'||typeof demoAedRate!=='string')throw new Error();
        if(!controller.signal.aborted){
          setPrice({estimatedCost,platformFee,commission,indicativePrice,senderAmount,senderCurrency,demoAedRate});
        }
      } catch {
        if(!controller.signal.aborted)setError('Price breakdown unavailable. Check your staff session and try again.');
      } finally {
        if(!controller.signal.aborted)setBusy(false);
      }
    })();
    return ()=>controller.abort();
  },[csrfToken,discoveryId]);

  return <dialog ref={dialog} className="catalogue-price-dialog" aria-labelledby={title} onClose={close}>
    <h2 id={title}>AED price breakdown</h2>
    <p>{product}</p>
    {price&&<Notice>Sender cost shown by the provider. AED conversion uses a demo exchange rate. Wallet settlement and provider fees await confirmation.</Notice>}
    {!price&&busy&&<p role="status">Loading saved provider cost…</p>}
    {price&&<dl className="catalogue-card-prices">
      <div><dt>Provider sender cost</dt><dd>{price.senderAmount} {price.senderCurrency}</dd></div>
      <div><dt>Demo exchange rate</dt><dd>{price.demoAedRate} AED per {price.senderCurrency}</dd></div>
      <div><dt>Estimated provider cost</dt><dd>AED {price.estimatedCost}</dd></div>
      <div><dt>Platform fee</dt><dd>AED {price.platformFee}</dd></div>
      <div><dt>Commission</dt><dd>AED {price.commission}</dd></div>
      <div><dt>Indicative selling price</dt><dd>AED {price.indicativePrice}</dd></div>
    </dl>}
    {error&&<p role="alert" className="field-error">{error}</p>}
    <div className="catalogue-price-actions">
      <Button variant="secondary" onClick={()=>dialog.current?.close()}>Close</Button>
    </div>
  </dialog>;
}
