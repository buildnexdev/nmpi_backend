"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.slugify = slugify;
exports.requireFields = requireFields;
exports.pickOptional = pickOptional;
exports.oneOf = oneOf;
const types_1 = require("../types");
function slugify(title) {
    const base = String(title || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')
        .slice(0, 80);
    const suffix = Date.now().toString(36);
    return base ? `${base}-${suffix}` : `item-${suffix}`;
}
function requireFields(data, fields) {
    for (const [field, label] of fields) {
        if (data[field] === undefined || data[field] === null || String(data[field]).trim() === '') {
            throw new types_1.HttpError(400, `${label} is required`, 'VALIDATION_ERROR', { field });
        }
    }
}
function pickOptional(data, field) {
    const v = data[field];
    return v === undefined || v === null || String(v).trim() === '' ? null : String(v).trim();
}
function oneOf(value, allowed, fallback) {
    return allowed.includes(value) ? value : fallback;
}
