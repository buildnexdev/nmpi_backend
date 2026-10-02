"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateMemberId = generateMemberId;
/**
 * Formats a sequence integer into a standard Member ID.
 * Example: generateMemberId(104) -> "ORG-2026-000104"
 */
function generateMemberId(sequenceNumber, year = new Date().getFullYear()) {
    const padded = sequenceNumber.toString().padStart(6, '0');
    return `ORG-${year}-${padded}`;
}
