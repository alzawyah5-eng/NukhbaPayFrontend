export function formatLocal(utc: string | null, zone = 'Asia/Dubai') {
  if (!utc) return 'Never';
  try { return new Intl.DateTimeFormat('en-GB', {timeZone: zone, day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'}).format(new Date(utc)); }
  catch { return 'Unknown'; }
}
export function initials(name: string) { return name.split(/\s+/).filter(Boolean).slice(0,2).map(w => w[0]?.toUpperCase() ?? '').join(''); }
