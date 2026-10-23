export function normalizeIp(raw = '') {
  let ip = String(raw || '').trim();
  if (!ip) return 'unknown';
  if (ip.startsWith('::ffff:')) ip = ip.slice(7); // IPv4 written in IPv6 style
  if (ip === '::1') ip = '127.0.0.1';
  return ip;
}