import { useEffect, useRef, useState, type FormEvent } from 'react';
import { KioskStage, type Screen } from './KioskStage';
import { layoutOnly, nextLayout, walkthroughs } from './kioskFlows';
import { giftGroups, searchDesign, searchPageSize, type GiftGroup } from './kioskSearch';
import design from './design.json';
import './kiosk.css';

const asiaOrder = ['ae', 'in', 'pk', 'bd', 'ph', 'sa', 'qa', 'kw', 'bh', 'om', 'np', 'lk'];
const pageSize = 6;
const aliases: Record<string, string> = { ae: 'UAE', gb: 'UK Britain', us: 'USA America' };
const giftLogos = { Apple: 'apple', 'Google Play': 'google_play', Steam: 'steam', 'PUBG Mobile': 'pubg', PlayStation: 'playstation' } as const;
const operators = ['e& UAE', 'du UAE', 'Virgin Mobile'];
const plans = { '1 GB': { days: 7, fils: 1500 }, '3 GB': { days: 15, fils: 2500 }, '5 GB': { days: 30, fils: 4000 } } as const;
const reviews = {
  review: 'topup', review_bill: 'bill_detail', review_wallet: 'wallets',
  review_gift: 'gift_detail', review_transport: 'transport', review_esim: 'esim',
} as const;
const initialAmounts = { topup: 5000, gift_detail: 5000, transport: 5000 };
const previewFee = 500;
const previewIdleMs = 2 * 60 * 1000;
const warningSeconds = 30;
const billers = ['Electricity & water', 'Mobile postpaid', 'Home internet', 'Government services'];
const inputLabels = {
  countrySearch: 'Search countries', serviceSearch: 'Search services, brands and products', phone: 'Example mobile number',
  account: 'Example bill account', wallet: 'Example wallet number', wallet_amount: 'Example amount in AED',
  toll: 'Example toll account', reference: 'Example transaction reference',
} as const;
type EditField = keyof typeof inputLabels;
type GiftBrand = keyof typeof giftLogos;
type PlanSize = keyof typeof plans;
type Review = keyof typeof reviews;
type DenominationScreen = keyof typeof initialAmounts;

function isScreen(value: string): value is Screen {
  return Object.hasOwn(design.screens, value);
}

function isReview(value: string): value is Review {
  return Object.hasOwn(reviews, value);
}

const money = (fils: number) => 'AED ' + (fils / 100).toFixed(2);
const digits = (value?: string) => value?.replace(/\D/g, '') ?? '';

function walletAmount(value?: string) {
  const parts = value?.match(/^(\d{1,3})(?:\.(\d{1,2}))?$/);
  if (!parts) return null;
  const fils = Number(parts[1]) * 100 + Number((parts[2] ?? '').padEnd(2, '0'));
  return fils >= 500 && fils <= 50000 ? fils : null;
}

function isDenominationScreen(value: Screen): value is DenominationScreen {
  return Object.hasOwn(initialAmounts, value);
}

export default function Kiosk() {
  const query = new URLSearchParams(window.location.search);
  const gallery = query.get('preview') === '1';
  const requestedScreen = query.get('screen') ?? '';
  const [screen, setScreen] = useState<Screen>(() => gallery && isScreen(requestedScreen) ? requestedScreen : 'home');
  const [returnTo, setReturnTo] = useState<Screen>('home');
  const [timeoutReturn, setTimeoutReturn] = useState<Screen>('home');
  const [sessionActive, setSessionActive] = useState(false);
  const [review, setReview] = useState<Review>('review');
  const [continent, setContinent] = useState('Asia');
  const [countryQuery, setCountryQuery] = useState('');
  const [countryIndex, setCountryIndex] = useState(0);
  const [highlighted, setHighlighted] = useState('ae');
  const [serviceQuery, setServiceQuery] = useState<string | null>(null);
  const [serviceIndex, setServiceIndex] = useState(0);
  const [giftGroup, setGiftGroup] = useState<GiftGroup>('All');
  const [operator, setOperator] = useState(operators[0]);
  const [biller, setBiller] = useState(billers[0]);
  const [giftBrand, setGiftBrand] = useState<GiftBrand>('Apple');
  const [plan, setPlan] = useState<PlanSize>('3 GB');
  const [receipt, setReceipt] = useState('digital');
  const [amounts, setAmounts] = useState(initialAmounts);
  const [values, setValues] = useState<Record<string, string>>({});
  const [activeField, setActiveField] = useState<EditField>('phone');
  const [edit, setEdit] = useState<EditField | null>(null);
  const [entry, setEntry] = useState('');
  const [notice, setNotice] = useState('');
  const [contrast, setContrast] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(warningSeconds);
  const dialog = useRef<HTMLDialogElement>(null);
  const warningDeadline = useRef(0);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'NukhbaPay Kiosk';
    return () => { document.title = previousTitle; };
  }, []);

  useEffect(() => {
    const modal = dialog.current;
    if (edit && modal && !modal.open) modal.showModal();
  }, [edit]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 6500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (gallery || !sessionActive || screen === 'welcome' || screen === 'timeout') return;
    let idleTimer: number;
    function restartIdleTimer() {
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        dialog.current?.close();
        setEdit(null);
        setEntry('');
        setNotice('');
        setTimeoutReturn(screen);
        setSecondsRemaining(warningSeconds);
        warningDeadline.current = Date.now() + warningSeconds * 1000;
        setScreen('timeout');
      }, previewIdleMs);
    }
    restartIdleTimer();
    window.addEventListener('pointerdown', restartIdleTimer);
    window.addEventListener('keydown', restartIdleTimer);
    window.addEventListener('input', restartIdleTimer);
    return () => {
      window.clearTimeout(idleTimer);
      window.removeEventListener('pointerdown', restartIdleTimer);
      window.removeEventListener('keydown', restartIdleTimer);
      window.removeEventListener('input', restartIdleTimer);
    };
  }, [screen, gallery, sessionActive]);

  useEffect(() => {
    if (screen !== 'timeout' || gallery) return;
    const timer = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((warningDeadline.current - Date.now()) / 1000));
      setSecondsRemaining(remaining);
      if (remaining === 0) reset();
    }, 250);
    return () => window.clearInterval(timer);
  }, [screen, gallery]);

  const search = countryQuery.trim().toLocaleLowerCase();
  const countries = design.countries.filter(country => search
    ? `${country.name} ${country.code} ${aliases[country.code] ?? ''}`.toLocaleLowerCase().includes(search)
    : country.continent === continent);
  if (!search && continent === 'Asia') {
    countries.sort((a, b) => asiaOrder.indexOf(a.code) - asiaOrder.indexOf(b.code));
  }
  const countryPages = Math.max(1, Math.ceil(countries.length / pageSize));
  const countryPage = Math.min(countryIndex, countryPages - 1);
  const slot = countries.slice(countryPage * pageSize, (countryPage + 1) * pageSize);

  function openEditor(field: EditField, prefill?: string) {
    const currentValue = field === 'countrySearch' ? countryQuery
      : field === 'serviceSearch' ? serviceQuery ?? '' : values[field] ?? '';
    setEntry(prefill ?? currentValue);
    setEdit(field);
  }

  function closeEditor() {
    dialog.current?.close();
    setEdit(null);
    setEntry('');
  }

  function saveField(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (edit === 'serviceSearch') {
      setServiceQuery(entry.trim());
      setServiceIndex(0);
      setScreen('search');
    } else if (edit === 'countrySearch') {
      setCountryQuery(entry.trim());
      setCountryIndex(0);
    } else if (edit) {
      setActiveField(edit);
      setValues(current => ({ ...current, [edit]: entry.trim() }));
    }
    closeEditor();
  }

  function reset(next: Screen = 'welcome') {
    closeEditor();
    setNotice('');
    setValues({});
    setCountryQuery('');
    setCountryIndex(0);
    setHighlighted('ae');
    setContinent('Asia');
    setServiceQuery(null);
    setServiceIndex(0);
    setGiftGroup('All');
    setAmounts(initialAmounts);
    setPlan('3 GB');
    setReceipt('digital');
    setOperator(operators[0]);
    setBiller(billers[0]);
    setGiftBrand('Apple');
    setReview('review');
    setActiveField('phone');
    setContrast(false);
    setReturnTo('home');
    setTimeoutReturn('home');
    setSessionActive(false);
    setScreen(next);
  }

  function navigate(target: string, label = '') {
    setNotice('');
    if (screen === 'timeout' && !gallery && (target === 'welcome' || Date.now() >= warningDeadline.current)) {
      reset();
      return;
    }
    if (target === 'resume' || target === 'access_apply') {
      setScreen(screen === 'timeout' ? timeoutReturn : returnTo);
      return;
    }
    if (target === 'language_preview') {
      setNotice('This design includes English flows and an Arabic home.');
      return;
    }
    if (!isScreen(target)) return;
    setSessionActive(true);
    if (screen === 'bill_detail' && target === 'bill_result') {
      const account = values.account ?? (gallery ? '1234 5678 90' : '');
      if (account.replace(/\s/g, '').length < 4) {
        setScreen('invalid');
        return;
      }
      if (gallery && biller !== billers[0]) {
        setNotice('The supplied bill result is available for the electricity and water example.');
        return;
      }
    }
    if (!gallery && (screen === 'card' || screen === 'qr') && target === 'cancel_wait') target = 'payment';
    if (!gallery && screen === 'cash' && target === 'cash_issue') target = 'help';
    if (!gallery && target === 'status' && screen === 'track_verify') {
      setNotice('Transaction status requires a connected receipt verification service.');
      return;
    }
    if (!gallery && layoutOnly.has(target)) {
      setScreen('unavailable');
      return;
    }
    if (target === 'search') {
      if (serviceQuery === null) setServiceQuery('');
      setScreen('search');
      openEditor('serviceSearch', label.includes('Retail gift cards') ? 'gift' : undefined);
      return;
    }
    if (screen === 'mobile' && target === 'mobile' && label.includes('Data bundles')) {
      setServiceQuery('data bundles');
      setServiceIndex(0);
      setScreen('search');
      return;
    }
    const interruptionScreens = ['language', 'accessibility', 'restart', 'timeout', 'large_text'];
    if (interruptionScreens.includes(target) && !interruptionScreens.includes(screen)) setReturnTo(screen);
    if (screen === 'language' && target === 'home' && /\b(Back|English)\b/.test(label)) target = returnTo;
    if (isReview(screen)) {
      setReview(screen);
      if (target === 'topup') target = reviews[screen];
    }
    if (['terms', 'payment', 'price_changed', 'cancelled'].includes(screen) && target === 'review') target = review;
    if (isReview(target)) {
      const phoneLength = digits(values.phone).length;
      if (!gallery && target === 'review' && (phoneLength < 7 || phoneLength > 15)) {
        setNotice('Enter an example mobile number with 7 to 15 digits.');
        return;
      }
      if (!gallery && target === 'review_wallet' && (!values.wallet || walletAmount(values.wallet_amount) === null)) {
        setNotice('Enter an example wallet ID and an amount from AED 5 to AED 500.');
        return;
      }
      if (!gallery && target === 'review_transport' && !values.toll) {
        setNotice('Enter an example toll account or reference.');
        return;
      }
      setReview(target);
    }
    if (target === 'topup') {
      setActiveField('phone');
      const selectedOperator = operators.find(name => label.includes(name));
      if (selectedOperator) setOperator(selectedOperator);
    }
    if (target === 'transport') setActiveField('toll');
    if (target === 'bill_detail') {
      setActiveField('account');
      const selected = billers.find(name => label.includes(name));
      if (selected) setBiller(selected);
    }
    if (target === 'wallets') setActiveField('wallet');
    if (target === 'track') setActiveField('reference');
    if (target === 'gift_detail') {
      const selectedBrand = (Object.keys(giftLogos) as GiftBrand[]).find(brand => label.includes(brand));
      if (selectedBrand) setGiftBrand(selectedBrand);
      const denomination = label.match(/\bAED (50|100|200)\b/);
      if (screen === 'search' && denomination) {
        setAmounts(current => ({ ...current, gift_detail: Number(denomination[1]) * 100 }));
      }
    }
    if (target === 'welcome') {
      reset();
      return;
    }
    if (isScreen(target)) setScreen(target);
  }

  function act(action: string) {
    setSessionActive(true);
    const [type, value] = action.split(':', 2);
    switch (type) {
      case 'country-search':
        openEditor('countrySearch');
        break;
      case 'gift-filter':
        if (Object.hasOwn(giftGroups, value)) setGiftGroup(value as GiftGroup);
        break;
      case 'search-page': {
        const max = Math.max(0, Math.ceil(searchDesign(serviceQuery ?? '').length / searchPageSize) - 1);
        setServiceIndex(index => Math.max(0, Math.min(max, index + (value === 'next' ? 1 : -1))));
        break;
      }
      case 'country-shortcut': {
        const country = design.countries.find(item => item.code === value);
        if (!country) break;
        setHighlighted(country.code);
        setContinent(country.continent);
        setCountryQuery('');
        setCountryIndex(Math.floor(Math.max(0, asiaOrder.indexOf(country.code)) / pageSize));
        setScreen('country');
        break;
      }
      case 'country': {
        const country = design.countries.find(item => item.code === value);
        if (!country) break;
        setHighlighted(country.code);
        if (country.code === 'ae') navigate('home');
        else setNotice(`${country.name} selected. The supplied service layouts use UAE examples.`);
        break;
      }
      case 'continent':
        setCountryQuery('');
        setContinent(value);
        setCountryIndex(0);
        break;
      case 'country-page':
        setCountryIndex(index => Math.max(0, Math.min(countryPages - 1, index + (value === 'next' ? 1 : -1))));
        break;
      case 'focus':
        if (Object.hasOwn(inputLabels, value)) openEditor(value as EditField);
        else setNotice('Verification is available when the kiosk is connected.');
        break;
      case 'key':
        setValues(current => {
          const previous = current[activeField] ?? '';
          const next = value === 'Clear' ? '' : value === '⌫' ? previous.slice(0, -1) : (previous + value).slice(0, 24);
          return { ...current, [activeField]: next };
        });
        break;
      case 'amount':
        if (isDenominationScreen(screen)) {
          const fils = Number(value) * 100;
          setAmounts(current => ({ ...current, [screen]: fils }));
        }
        break;
      case 'esim':
        if (Object.hasOwn(plans, value)) setPlan(value as PlanSize);
        break;
      case 'delivery':
        setReceipt(value);
        break;
      case 'access':
        if (value === 'contrast') setContrast(current => !current);
        else if (value === 'large') navigate('large_text');
        else setNotice('Audio guidance requires a kiosk with audio support.');
        break;
      case 'wallet':
      case 'transport':
        setNotice(`${value} is shown for layout review. Availability requires a connected kiosk.`);
        break;
      case 'refresh_status':
        setNotice('Transaction status requires a connected kiosk.');
        break;
    }
  }

  const planDetails = plans[plan];
  const previewAmounts: Partial<Record<Review, number>> = {
    review: amounts.topup, review_gift: amounts.gift_detail, review_esim: planDetails.fils,
    review_transport: amounts.transport, review_wallet: walletAmount(values.wallet_amount) ?? 5000,
    review_bill: 18640,
  };
  const paying = ['payment', 'card', 'cash', 'qr'].includes(screen);
  const reviewFils = isReview(screen) ? previewAmounts[screen] : paying ? previewAmounts[review] : undefined;
  const reviewTotal = reviewFils === undefined ? undefined : reviewFils + previewFee;
  const delivery = receipt === 'print' ? 'Printed voucher' : 'Private digital receipt';
  const products: Partial<Record<Review, string>> = {
    review: `${operator} • Mobile recharge`, review_gift: `${giftBrand} gift card • UAE`,
    review_esim: `Travel eSIM • ${plan} / ${planDetails.days} days`,
  };
  const recipient = screen === 'review' ? values.phone
    : screen === 'review_wallet' ? values.wallet
    : screen === 'review_transport' ? values.toll : undefined;
  const order: Record<string, string> = {};
  if (reviewFils !== undefined && reviewTotal !== undefined) {
    order.value = money(reviewFils);
    order.total = money(reviewTotal);
    order.totalBadge = 'TOTAL  ' + money(reviewTotal);
  }
  const exactCashLayout = reviewTotal === undefined || reviewTotal % 500 === 0;
  if (isReview(screen) && products[screen]) order.product = products[screen];
  if (recipient) order.recipient = `•••• ${recipient.slice(-4)}`;
  if (screen === 'review_gift' || screen === 'review_esim') order.recipient = delivery;
  const stageValues: Record<string, string> = {
    ...values,
    ...(reviewTotal !== undefined && { reviewTotal: (reviewTotal / 100).toFixed(2) }),
    giftBrand,
  };
  if (!gallery) {
    stageValues.phone = values.phone || 'Enter example mobile number';
    stageValues.account = values.account || 'Enter example account';
    stageValues.wallet = values.wallet || 'Enter example wallet number';
    stageValues.wallet_amount = values.wallet_amount || 'Enter example amount';
    stageValues.toll = values.toll || 'Enter example account';
    stageValues.reference = values.reference || 'Enter example reference';
  }
  const serviceResults = searchDesign(serviceQuery ?? '');
  const next = nextLayout[screen];

  return <main className={`kiosk-page${contrast ? ' kiosk-page--contrast' : ''}`} aria-label="NukhbaPay Kiosk">
    {gallery && <div className="kiosk-gallery">
      <span className="kiosk-gallery-caption">Design walkthrough · Payments and device actions are disabled</span>
      <label htmlFor="kiosk-flow">Journey</label>
      <select id="kiosk-flow" value="" onChange={event => {
        if (isScreen(event.target.value)) reset(event.target.value);
      }}>
        <option value="" disabled>Choose a journey</option>
        {walkthroughs.map(item => <option key={item.start} value={item.start}>{item.label}</option>)}
      </select>
      <label htmlFor="kiosk-screen">Screen preview</label>
      <select id="kiosk-screen" value={screen} onChange={event => {
        if (isScreen(event.target.value)) setScreen(event.target.value);
      }}>
        {Object.entries(design.titles).map(([value, title]) => <option key={value} value={value}>{title}</option>)}
      </select>
      {next && <button type="button" onClick={() => setScreen(next)}>Next layout · {design.titles[next]}</button>}
      <button type="button" onClick={() => reset('home')}>Restart walkthrough</button>
      <a href="/kiosk">Back to kiosk</a>
    </div>}
    <div className="kiosk-stage" lang={screen === 'arabic' ? 'ar' : 'en'}>
      <KioskStage key={screen} screen={screen} values={stageValues} order={order}
        countryPage={{ items: slot, index: countryPage, pages: countryPages, count: countries.length, query: countryQuery, continent, highlighted }}
        giftArtwork={design.brands[giftLogos[giftBrand]]} giftBrand={giftBrand} operator={operator}
        giftGroup={giftGroup} biller={biller}
        exactCashLayout={exactCashLayout}
        search={serviceQuery === null ? undefined : {
          query: serviceQuery, page: serviceIndex, total: serviceResults.length,
          items: serviceResults.slice(serviceIndex * searchPageSize, (serviceIndex + 1) * searchPageSize),
        }}
        selectedActions={[...(search ? [] : ['continent:' + continent]),
          ...(isDenominationScreen(screen) ? ['amount:' + amounts[screen] / 100] : []), 'esim:' + plan,
          'delivery:' + receipt, ...(contrast ? ['access:contrast'] : [])]}
        previewScreens={gallery} timeoutSeconds={secondsRemaining} onNavigate={navigate} onAction={act} />
    </div>
    {notice && <div className="kiosk-notice" role="status">
      <span>{notice}</span><button type="button" aria-label="Dismiss message" onClick={() => setNotice('')}>×</button>
    </div>}
    {edit && <dialog ref={dialog} className="kiosk-editor" aria-labelledby="kiosk-edit-label" onClose={() => setEdit(null)}>
      <form onSubmit={saveField}>
        <label id="kiosk-edit-label" htmlFor="kiosk-entry">{inputLabels[edit]}</label>
        <input id="kiosk-entry" autoFocus autoComplete="off" value={entry} maxLength={80}
          inputMode={['phone', 'account', 'wallet', 'toll'].includes(edit) ? 'numeric' : edit === 'wallet_amount' ? 'decimal' : 'search'}
          onChange={event => setEntry(event.target.value)} />
        <div className="kiosk-editor-actions">
          <button type="button" onClick={closeEditor}>Cancel</button>
          <button type="submit">{edit === 'serviceSearch' || edit === 'countrySearch' ? 'Search' : 'Apply'}</button>
        </div>
      </form>
    </dialog>}
  </main>;
}
