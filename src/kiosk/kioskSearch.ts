import design from './design.json';
import type { Screen } from './KioskStage';

export const giftGroups = {
  All: [],
  Gaming: ['Steam wallet', 'PUBG Mobile', 'PlayStation'],
  'App stores': ['Apple gift card', 'Google Play'],
  Shopping: ['Retail gift cards'],
} as const;
export type GiftGroup = keyof typeof giftGroups;

export interface SearchResult {
  title: string;
  detail: string;
  badge: string;
  screen: Screen;
  artwork?: string;
  denomination?: number;
}

// Only the products and categories authored in the design are searchable here.
const items: SearchResult[] = [
  ...[50, 100, 200].map(denomination => ({
    title: 'Apple gift card', detail: `UAE store • AED ${denomination}`, badge: 'UAE',
    screen: 'gift_detail' as const, artwork: design.brands.apple, denomination,
  })),
  { title: 'Google Play', detail: 'Store region must match', badge: 'Gift', screen: 'gift_detail', artwork: design.brands.google_play },
  { title: 'Steam wallet', detail: 'Gaming wallet credit', badge: 'Games', screen: 'gift_detail', artwork: design.brands.steam },
  { title: 'PUBG Mobile', detail: 'In-game credit packages', badge: 'Games', screen: 'gift_detail', artwork: design.brands.pubg },
  { title: 'PlayStation', detail: 'Region-specific gift cards', badge: 'Games', screen: 'gift_detail', artwork: design.brands.playstation },
  { title: 'e& UAE', detail: 'Prepaid mobile recharge', badge: 'Airtime', screen: 'topup', artwork: design.brands.eand },
  { title: 'du UAE', detail: 'Prepaid mobile recharge', badge: 'Airtime', screen: 'topup', artwork: design.brands.du },
  { title: 'Virgin Mobile', detail: 'Mobile recharge', badge: 'Airtime', screen: 'topup', artwork: design.brands.virgin },
  { title: 'Electricity & water', detail: 'Bill inquiry', badge: 'Bills', screen: 'bill_detail' },
  { title: 'Home internet', detail: 'Bill inquiry', badge: 'Bills', screen: 'bill_detail', artwork: design.brands.du },
  { title: 'Mobile postpaid', detail: 'Bill inquiry', badge: 'Bills', screen: 'bill_detail', artwork: design.brands.eand },
  { title: 'Government services', detail: 'Bill inquiry', badge: 'Bills', screen: 'bill_detail' },
  { title: 'Wallet top-up', detail: 'Review wallet options', badge: 'Wallet', screen: 'wallets', artwork: design.brands.gcash },
  { title: 'Salik', detail: 'Toll recharge', badge: 'Transit', screen: 'transport', artwork: design.brands.salik },
  { title: 'Travel eSIM', detail: 'Data bundles for travel', badge: 'Travel', screen: 'esim' },
  { title: 'Money transfer', detail: 'Transfer and identity verification steps', badge: 'Transfer', screen: 'transfer' },
];

export const searchPageSize = 3;

export function searchDesign(query: string) {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return words.length ? items.filter(item => {
    const text = `${item.title} ${item.detail} ${item.badge}`.toLowerCase();
    return words.every(word => text.includes(word));
  }) : [];
}
