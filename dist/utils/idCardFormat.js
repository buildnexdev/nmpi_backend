"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ID_CARD_ROLE_TA = void 0;
exports.formatIdCardExpiry = formatIdCardExpiry;
exports.formatIdCardPhone = formatIdCardPhone;
exports.formatIdCardBloodGroup = formatIdCardBloodGroup;
exports.formatIdCardDesignation = formatIdCardDesignation;
/** Tamil labels used on the official member ID card template. */
exports.ID_CARD_ROLE_TA = {
    Member: 'உறுப்பினர்',
    Volunteer: 'தன்னார்வலர்',
    'Unit Coordinator': 'ஒன்றிய செயலாளர்',
    'Taluk Coordinator': 'தாலுகா செயலாளர்',
    'District Coordinator': 'மாவட்ட செயலாளர்',
    Admin: 'நிர்வாகி',
    'Super Admin': 'முதன்மை நிர்வாகி',
};
function formatIdCardExpiry(startDate) {
    const d = startDate ? new Date(startDate) : new Date();
    const year = (Number.isNaN(d.getTime()) ? new Date().getFullYear() : d.getFullYear()) + 2;
    return `31.12.${year}`;
}
function formatIdCardPhone(countryCode, phone) {
    const p = String(phone || '').replace(/\D/g, '');
    if (!p)
        return '—';
    const cc = (countryCode || '+91').trim();
    return `${cc} ${p}`;
}
function formatIdCardBloodGroup(value) {
    const v = String(value || '').trim();
    if (!v)
        return '—';
    if (v.toLowerCase() === 'unknown')
        return 'Unknown';
    return v;
}
/** Role / position line on the card (பதவி) — padhavi / role plus area (place name), as on the printed ID. */
function formatIdCardDesignation(member) {
    const custom = String(member.designation || '').trim();
    const role = String(member.role_name || 'Member').trim();
    const title = custom || exports.ID_CARD_ROLE_TA[role] || role;
    const place = String(member.block_name_ta || member.block_name || '').trim();
    if (place && !title.toLowerCase().includes(place.toLowerCase())) {
        return `${title},\n${place}`;
    }
    return title;
}
