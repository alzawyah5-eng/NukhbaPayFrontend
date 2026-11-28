import { createElement, type ReactNode } from 'react';
import design from './design.json';
import { offlineCopy } from './kioskFlows';
import { giftGroups, searchPageSize, type GiftGroup, type SearchResult } from './kioskSearch';

export type Screen = keyof typeof design.screens;
export type Country = (typeof design.countries)[number];
type Attribute = string | number | boolean;
type Attributes = Record<string, Attribute | undefined>;
type VectorNode = [string, Attributes, VectorNode[] | string | null];

interface StageProps {
  screen: Screen;
  values: Record<string, string>;
  order: Record<string, string>;
  countryPage: { items: Country[]; index: number; pages: number; count: number; query: string; continent: string; highlighted: string };
  giftArtwork?: string;
  operator: string;
  giftBrand: string;
  biller: string;
  giftGroup: GiftGroup;
  exactCashLayout: boolean;
  search?: { query: string; page: number; total: number; items: SearchResult[] };
  selectedActions: string[];
  previewScreens: boolean;
  timeoutSeconds: number;
  onNavigate: (screen: string, label: string) => void;
  onAction: (action: string) => void;
}

// The supplied screen layouts are vector data. React owns all elements and interactions.
export function KioskStage(props: StageProps) {
  const { screen, countryPage, onNavigate, onAction } = props;
  const search = screen === 'search' ? props.search : undefined;

  function render(node: VectorNode, key: number, country?: Country, selected?: boolean, result?: SearchResult): ReactNode {
    const [tag, original, children] = node;
    const attributes: Attributes = { ...original };
    let text = typeof children === 'string' ? children : null;
    const label = String(attributes['aria-label'] ?? '');
    const firstChild = Array.isArray(children) ? children[0] : undefined;
    const card = firstChild?.[1];

    if (screen === 'gifts' && tag === 'g') {
      if (attributes['data-go'] === 'gifts' && Object.hasOwn(giftGroups, label)) {
        attributes['data-action'] = 'gift-filter:' + label;
        delete attributes['data-go'];
        selected = props.giftGroup === label;
        attributes['aria-pressed'] = selected;
      } else if (props.giftGroup !== 'All' && card?.width === '356'
        && (attributes['data-go'] === 'gift_detail' || label === 'Retail gift cards')) {
        const placement = (giftGroups[props.giftGroup] as readonly string[]).indexOf(label);
        if (placement === -1) return null;
        attributes.transform = `translate(${288 + placement * 378 - Number(card.x)} ${442 - Number(card.y)})`;
      }
    }

    if (search && tag === 'g' && label === 'Apple gift card' && card?.x) {
      result = search.items[Math.round((Number(card.x) - 288) / 378)];
      if (!result) return null;
      attributes['data-go'] = result.screen;
      attributes['aria-label'] = result.denomination ? `${result.title}, AED ${result.denomination}` : result.title;
    }
    if (result && tag === 'image') {
      if (!result.artwork) return null;
      attributes.href = result.artwork;
    }
    if (result && tag === 'text') {
      if (text === 'Apple gift card') text = result.title;
      if (text === 'UAE') text = result.badge;
      if (text?.startsWith('UAE store')) text = result.detail;
    }
    if (search && text === 'Apple') text = search.query.slice(0, 56) || 'Search a service, brand or product';
    if (search && text === '3 matching products') {
      text = search.query ? `${search.total} ${search.total === 1 ? 'result' : 'results'}` : 'Search the design catalogue';
    }
    if (search && text?.startsWith('Gift cards are country-specific.')) {
      text = search.query && !search.total ? 'No matches. Try a brand, operator or service.'
        : 'Results come from the supplied design. Live availability requires a connected kiosk.';
    }
    if (screen === 'bill_detail' && text === 'Electricity & water • United Arab Emirates') {
      text = `${props.biller} • United Arab Emirates`;
    }

    if (attributes['data-country-slot'] !== undefined) {
      country = countryPage.items[Number(attributes['data-country-slot'])];
      if (!country) return null;
      attributes['data-action'] = 'country:' + country.code;
      attributes['aria-label'] = country.name;
    }

    if (country && attributes['data-country-flag'] !== undefined) {
      attributes.href = design.flags[country.code as keyof typeof design.flags];
    }
    if (country && attributes['data-country-label'] !== undefined) text = country.name;
    if (country && attributes['data-country-sub'] !== undefined) text = country.sub;
    if (country && tag === 'rect') {
      attributes.stroke = country.code === countryPage.highlighted ? '#5B2C91' : '#E6E1EC';
      attributes.strokeWidth = country.code === countryPage.highlighted ? '2' : '1';
    }
    if (attributes['data-country-count'] !== undefined) {
      const label = countryPage.query ? 'Search results' : countryPage.continent;
      text = `${label} · ${countryPage.count} ${countryPage.count === 1 ? 'country' : 'countries'}`;
    }
    if (attributes['data-country-page'] !== undefined) text = `Page ${countryPage.index + 1} of ${countryPage.pages}`;
    if (attributes['data-country-search'] !== undefined) text = countryPage.query || 'Search a country';
    if (attributes['data-country-empty'] !== undefined) {
      if (countryPage.count) return null;
      delete attributes.display;
    }

    const action = String(attributes['data-action'] ?? '');
    const target = String(attributes['data-go'] ?? '');
    if (!props.previewScreens && screen === 'track_verify' && action === 'focus:otp') {
      attributes['aria-disabled'] = true;
      attributes.tabIndex = -1;
    }
    if (!props.previewScreens && (screen === 'card' || screen === 'qr') && target === 'cancel_wait') {
      attributes['aria-label'] = 'Payment methods';
    }
    if (screen === 'payment' && target === 'cash' && !props.exactCashLayout) {
      attributes['aria-disabled'] = true;
      attributes.tabIndex = -1;
      attributes.opacity = 0.55;
    }
    if (/^(continent|amount|delivery|esim|access):/.test(action)) {
      selected = props.selectedActions.includes(action);
      attributes['aria-pressed'] = selected;
    }
    if (action === 'country-page:prev' || action === 'country-page:next') {
      const disabled = action.endsWith('prev') ? countryPage.index === 0 : countryPage.index === countryPage.pages - 1;
      attributes['aria-disabled'] = disabled;
      attributes.tabIndex = disabled ? -1 : 0;
      attributes.opacity = disabled ? 0.4 : 1;
    }
    if (screen === 'timeout' && !props.previewScreens && (action || target) && target !== 'resume' && target !== 'welcome') {
      attributes['aria-disabled'] = true;
      attributes.tabIndex = -1;
    }
    if (selected !== undefined && (tag === 'rect' || tag === 'text')) {
      attributes.fill = tag === 'rect' ? (selected ? '#5B2C91' : '#FFFFFF') : (selected ? '#FFFFFF' : '#241C30');
      if (tag === 'rect') attributes.stroke = selected ? '#5B2C91' : '#E6E1EC';
    }

    const valueKey = attributes['data-value'];
    const orderKey = attributes['data-order'];
    if (typeof valueKey === 'string') text = props.values[valueKey] ?? text;
    if (typeof orderKey === 'string') text = props.order[orderKey] ?? text;
    if (screen === 'topup' && text?.startsWith('e& UAE • Prepaid')) {
      text = text.replace('e& UAE', props.operator);
    }
    if (screen === 'gift_detail' && text === 'Apple gift card') text = props.giftBrand + ' gift card';
    if (attributes['data-brand-slot'] === 'gift' && props.giftArtwork) attributes.href = props.giftArtwork;
    if (attributes['data-brand-bg'] !== undefined && props.giftBrand === 'Steam') attributes.fill = '#171D25';
    if (text === 'Kiosk DXB-014') {
      if (props.previewScreens || screen === 'timeout') text = 'Layout preview';
      else return (
        <a key={key} className="kiosk-preview-link" href={`/kiosk?preview=1&screen=${screen}`} aria-label="Preview kiosk journeys">
          <rect x="20" y="1010" width="151" height="64" rx="12" fill="transparent" />
          {createElement(tag, attributes, 'Preview journeys')}
        </a>
      );
    }
    if (screen === 'timeout' && text?.startsWith('For your privacy, this session ends in')) {
      text = `For your privacy, this session ends in ${props.timeoutSeconds} seconds.`;
    }
    if (text === 'This product is temporarily unavailable.' && !props.previewScreens) {
      text = 'Use Preview journeys to see the remaining design steps.';
    }
    if (screen === 'payment' && !props.exactCashLayout) {
      if (text === 'Insert accepted notes at the cash') text = 'Exact cash is unavailable';
      if (text === 'slot.') text = 'for this example total.';
    }
    if (text && !props.previewScreens) text = offlineCopy[screen]?.[text] ?? text;
    if ((screen === 'card' || screen === 'qr' || screen === 'cash') && text === 'AED 55.00') {
      text = props.order.total ?? text;
    }
    if (screen === 'cash' && text === 'Insert AED 50 + AED 5 for this order.' && props.order.total) {
      text = 'Example total · ' + props.order.total;
    }

    const activate = () => {
      if (attributes['aria-disabled']) return;
      if (target) {
        const visibleLabel = Array.isArray(children)
          ? children.filter(child => child[0] === 'text').map(child => child[2]).join(' ')
          : '';
        onNavigate(target, result ? `${attributes['aria-label']} ${result.detail}` : `${attributes['aria-label'] ?? ''} ${visibleLabel}`);
      } else if (action) {
        onAction(action);
      }
    };

    const contents = Array.isArray(children) ? children.map((child, index) => render(child, index, country, selected, result)) : text;
    return createElement(tag, {
      ...attributes,
      key,
      ...((action || target) && {
        onClick: activate,
        onKeyDown: (event: React.KeyboardEvent) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            activate();
          }
        },
      }),
    }, tag === 'svg' && search && search.total > searchPageSize
      ? <>
        {contents}
        <foreignObject x="610" y="855" width="790" height="74">
          <div className="kiosk-search-pager">
            <span>Page {search.page + 1} of {Math.ceil(search.total / searchPageSize)}</span>
            <button type="button" disabled={search.page === 0} onClick={() => onAction('search-page:prev')}>Previous</button>
            <button type="button" disabled={(search.page + 1) * searchPageSize >= search.total} onClick={() => onAction('search-page:next')}>Next</button>
          </div>
        </foreignObject>
      </> : contents);
  }

  return render(design.screens[screen] as unknown as VectorNode, 0);
}
