import { HttpError } from '../types';

export function slugify(title: string): string {
  const base = String(title || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 80);
  const suffix = Date.now().toString(36);
  return base ? `${base}-${suffix}` : `item-${suffix}`;
}

export function requireFields(data: any, fields: Array<[string, string]>) {
  for (const [field, label] of fields) {
    if (data[field] === undefined || data[field] === null || String(data[field]).trim() === '') {
      throw new HttpError(400, `${label} is required`, 'VALIDATION_ERROR', { field });
    }
  }
}

export function pickOptional(data: any, field: string): string | null {
  const v = data[field];
  return v === undefined || v === null || String(v).trim() === '' ? null : String(v).trim();
}

export function oneOf<T extends string>(value: any, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value) ? value : fallback;
}
