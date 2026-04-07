/**
 * Normalizes email for storage and lookup (trim + lowercase).
 */
export const normalizeEmail = (raw: string): string => raw.trim().toLowerCase();

/**
 * Rejects obviously invalid addresses (missing @, no domain, bad TLD, etc.).
 * Not a full RFC parser, but blocks random strings from registering as "email".
 */
export const isValidEmailFormat = (raw: string): boolean => {
  const email = normalizeEmail(raw);
  if (email.length === 0 || email.length > 254) return false;
  if (email.includes('..')) return false;

  const at = email.indexOf('@');
  if (at <= 0 || at === email.length - 1) return false;

  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  if (local.length > 64) return false;
  // Local part: allow + and common punctuation used in real addresses
  if (!/^[a-z0-9](?:[a-z0-9._+-]*[a-z0-9])?$/i.test(local)) return false;

  const labels = domain.split('.');
  if (labels.length < 2) return false;
  const tld = labels[labels.length - 1];
  if (tld.length < 2 || !/^[a-z]{2,63}$/i.test(tld)) return false;
  if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i.test(domain)) return false;

  return true;
};
