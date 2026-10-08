/**
 * Public member ID: nmpi + parliament constituency code + zero-padded tblMembers.id
 * Example: nmpi + Ar + 01110 → nmpiAr01110
 */
export function generateMemberId(memberDbId: number, parliamentCode: string = 'TN'): string {
  const code = String(parliamentCode || 'TN').trim();
  const seq = String(memberDbId).padStart(5, '0');
  return `nmpi${code}${seq}`;
}
