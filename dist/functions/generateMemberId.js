"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateMemberId = generateMemberId;
/**
 * Generates a unique Member ID based on Parliament Constituency Code.
 * Format: 001[PARLIAMENT_CODE][5_DIGIT_SEQ]
 * Example: generateMemberId(42131, 'TR') -> "001TR42131"
 */
function generateMemberId(sequenceId, parliamentCode = 'TN') {
    const code = (parliamentCode || 'TN').toUpperCase().trim();
    const paddedSeq = sequenceId.toString().padStart(5, '0');
    const prefix = '001';
    return `${prefix}${code}${paddedSeq}`;
}
