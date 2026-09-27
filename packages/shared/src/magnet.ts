/** Extract info-hash from magnet URI or bare btih (hex or base32). */
export function parseInfoHashFromMagnet(uri: string): string | null {
  if (!uri) return null;

  const hex = uri.match(/btih:([a-f0-9]{40})/i);
  if (hex) return hex[1].toLowerCase();

  const base32 = uri.match(/btih:([a-z2-7]{32})/i);
  if (base32) return base32[1].toLowerCase();

  if (/^[a-f0-9]{40}$/i.test(uri)) return uri.toLowerCase();
  if (/^[a-z2-7]{32}$/i.test(uri)) return uri.toLowerCase();

  return null;
}
