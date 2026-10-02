/**
 * Formats a sequence integer into a standard Member ID.
 * Example: generateMemberId(104) -> "ORG-2026-000104"
 */
export function generateMemberId(sequenceNumber: number, year: number = new Date().getFullYear()): string {
  const padded = sequenceNumber.toString().padStart(6, '0');
  return `ORG-${year}-${padded}`;
}
