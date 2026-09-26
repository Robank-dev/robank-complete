export function usd(value: number | null | undefined, { compact = false } = {}) {
  if (value == null || !Number.isFinite(value)) return '—';
  if (compact && Math.abs(value) >= 1000) {
    return '$' + new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(value);
  }
  return '$' + value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Formats a decimal string without losing precision to floating point for large balances. */
export function amount(value: string | number, maxFraction = 6) {
  const text = typeof value === 'number' ? value.toString() : value;
  if (!/^-?\d+(\.\d+)?$/.test(text)) return text;
  const [whole, fraction = ''] = text.split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const trimmed = fraction.slice(0, maxFraction).replace(/0+$/, '');
  if (!trimmed && fraction && /^0*$/.test(whole.replace('-', '')) && /[1-9]/.test(fraction)) return '<0.' + '0'.repeat(maxFraction - 1) + '1';
  return trimmed ? `${grouped}.${trimmed}` : grouped;
}

export function short(value?: string | null, head = 6, tail = 4) {
  if (!value) return '';
  return value.length <= head + tail + 1 ? value : `${value.slice(0, head)}…${value.slice(-tail)}`;
}

export function percent(value: number | null | undefined, digits = 2) {
  return value == null || !Number.isFinite(value) ? '—' : `${value.toFixed(digits)}%`;
}

export function relativeTime(iso: string) {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return '';
  const s = Math.round((Date.now() - t) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
