const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function parseIsoParts(iso) {
  if (!iso || typeof iso !== 'string') return null;
  const dateOnly = iso.slice(0, 10);
  const parts = dateOnly.split('-');
  if (parts.length !== 3) return null;
  const [y, m, d] = parts.map(Number);
  if (!y || !m || !d) return null;
  return { y, m, d };
}

export function formatDate(iso, options = {}) {
  const parts = parseIsoParts(iso);
  if (!parts) return iso || '';
  const { y, m, d } = parts;
  const month = MONTH_NAMES_SHORT[m - 1];
  return options.omitYear ? `${month} ${d}` : `${month} ${d}, ${y}`;
}

export function formatDateTime(iso) {
  const date = formatDate(iso);
  if (!date || typeof iso !== 'string' || !iso.includes('T')) return date;
  const time = iso.split('T')[1].slice(0, 5);
  if (time.length !== 5 || time[2] !== ':') return date;
  return `${date} · ${time}`;
}
