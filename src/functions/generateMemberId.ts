/**
 * Generates a unique Member ID based on Parliament Constituency Code.
 * Format: 001[PARLIAMENT_CODE][5_DIGIT_SEQ]
 * Example: generateMemberId(42131, 'TR') -> "001TR42131"
 */
export function generateMemberId(sequenceId: number, parliamentCode: string = 'TN'): string {
  const code = (parliamentCode || 'TN').toUpperCase().trim();
  const paddedSeq = sequenceId.toString().padStart(5, '0');
  const prefix = '001';
  return `${prefix}${code}${paddedSeq}`;
}
