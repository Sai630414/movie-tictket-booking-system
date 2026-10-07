export const escapeRegex = (value, maxLength = 100) =>
  String(value ?? '').slice(0, maxLength).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
