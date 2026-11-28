import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { PlatformApp } from './PlatformApp';
import './styles.css';

const kiosk = /^\/kiosk\/?$/.test(location.pathname);
const Kiosk = React.lazy(() => import('./kiosk/Kiosk'));
const preview = window.location.pathname === '/preview' || window.location.pathname.startsWith('/preview/');
const management = /^\/management(?:\/|$)/.test(location.pathname);
try {
  const pending=sessionStorage.getItem('nukhbapay.management-login')==='pending';
  if(pending && (location.pathname==='/' || location.pathname==='/login' && location.search==='?sign-in=failed')){
    sessionStorage.removeItem('nukhbapay.management-login');
    location.replace('/management'+location.search);
  }else if(!management && !kiosk){sessionStorage.removeItem('nukhbapay.management-login');}
}catch { /* The management bookmark remains available after sign-in. */ }
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {kiosk ? (
      <React.Suspense fallback={<main role="status">Loading NukhbaPay Kiosk…</main>}>
        <Kiosk />
      </React.Suspense>
    ) : (
      <BrowserRouter basename={management ? '/management' : preview ? '/preview' : '/'}>
        <PlatformApp management={management} />
      </BrowserRouter>
    )}
  </React.StrictMode>
);
