/** Tamil labels used on the official member ID card template. */
export const ID_CARD_ROLE_TA: Record<string, string> = {
  Member: 'உறுப்பினர்',
  Volunteer: 'தன்னார்வலர்',
  'Unit Coordinator': 'ஒன்றிய செயலாளர்',
  'Taluk Coordinator': 'தாலுகா செயலாளர்',
  'District Coordinator': 'மாவட்ட செயலாளர்',
  Admin: 'நிர்வாகி',
  'Super Admin': 'முதன்மை நிர்வாகி',
};

export function formatIdCardExpiry(startDate?: string | Date | null): string {
  const d = startDate ? new Date(startDate) : new Date();
  const year = (Number.isNaN(d.getTime()) ? new Date().getFullYear() : d.getFullYear()) + 2;
  return `31.12.${year}`;
}

export function formatIdCardPhone(countryCode?: string | null, phone?: string | null): string {
  const p = String(phone || '').replace(/\D/g, '');
  if (!p) return '—';
  const cc = (countryCode || '+91').trim();
  return `${cc} ${p}`;
}

export function formatIdCardBloodGroup(value?: string | null): string {
  const v = String(value || '').trim();
  if (!v) return '—';
  if (v.toLowerCase() === 'unknown') return 'Unknown';
  return v;
}

/** Role / position line on the card (பதவி) — custom designation if provided, else role plus area. */
export function formatIdCardDesignation(member: {
  designation?: string | null;
  role_name?: string | null;
  block_name?: string | null;
  block_name_ta?: string | null;
}): string {
  const custom = String(member.designation || '').trim();
  if (custom) return custom;
  const role = String(member.role_name || 'Member').trim();
  const roleTa = ID_CARD_ROLE_TA[role] || role;
  const place = String(member.block_name_ta || member.block_name || '').trim();
  return place ? `${roleTa},\n${place}` : roleTa;
}

