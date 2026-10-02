"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginSchema = exports.memberRegisterSchema = void 0;
const yup = __importStar(require("yup"));
exports.memberRegisterSchema = yup.object().shape({
    full_name: yup.string().required('Full Name is required'),
    father_name: yup.string().required("Father's Name is required"),
    date_of_birth: yup.string().required('Date of Birth is required'),
    gender: yup.string().oneOf(['MALE', 'FEMALE', 'OTHER']).required('Gender is required'),
    email: yup.string().email('Invalid email address').required('Email address is required'),
    mobile: yup.string().matches(/^[0-9+\-\s()]{7,20}$/, 'Invalid mobile phone number').required('Mobile number is required'),
    password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
    address_line1: yup.string().required('Address Line 1 is required'),
    address_line2: yup.string().nullable().optional(),
    village: yup.string().required('Village / Town is required'),
    taluk_id: yup.number().positive().required('Taluk selection is required'),
    district_id: yup.number().positive().required('District selection is required'),
    state: yup.string().required('State is required'),
    pincode: yup.string().matches(/^\d{5,10}$/, 'Invalid pincode').required('Pincode is required'),
    membership_type_id: yup.number().positive().required('Membership Type is required'),
    unit_id: yup.number().positive().required('Local Unit is required'),
    consent_terms: yup.boolean().oneOf([true], 'You must accept the terms and conditions'),
});
exports.loginSchema = yup.object().shape({
    login: yup.string().required('Email or Mobile number is required'),
    password: yup.string().required('Password is required'),
});
