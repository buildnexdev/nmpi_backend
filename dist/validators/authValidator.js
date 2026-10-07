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
exports.changePasswordSchema = exports.loginSchema = exports.memberRegisterSchema = void 0;
const yup = __importStar(require("yup"));
exports.memberRegisterSchema = yup.object().shape({
    full_name: yup.string().required('Full Name is required'),
    father_name: yup.string().required("Father's Name is required"),
    date_of_birth: yup.string().required('Date of Birth is required'),
    gender: yup.string().oneOf(['MALE', 'FEMALE', 'OTHER']).required('Gender is required'),
    country_code: yup.string().required('Country Code is required'),
    phone_number: yup.string().matches(/^[0-9+\-\s()]{7,20}$/, 'Invalid mobile phone number').required('Phone number is required'),
    email: yup.string().email('Invalid email address').required('Email address is required'),
    password: yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
    blood_group: yup.string().optional(),
    profile_image: yup.string().nullable().optional(),
    aadhaar_number: yup.string().required('Aadhaar number is required'),
    voter_id: yup.string().required('Voter ID is required'),
    state_id: yup.number().positive().optional(),
    parliament_constituency_id: yup.number().positive().required('Parliament Constituency is required'),
    assembly_constituency_id: yup.number().positive().nullable().optional(),
    district_id: yup.number().positive().required('District selection is required'),
    block_id: yup.number().positive().required('Block selection is required'),
    village_id: yup.number().positive().nullable().optional(),
    village_custom: yup.string().nullable().optional(),
    address_line1: yup.string().nullable().optional(),
    role_id: yup.number().positive().optional(),
});
exports.loginSchema = yup.object().shape({
    login: yup.string().required('Email or Mobile number is required'),
    password: yup.string().required('Password is required'),
});
exports.changePasswordSchema = yup.object().shape({
    current_password: yup.string().required('Current password is required'),
    new_password: yup.string().min(8, 'Password must be at least 8 characters').required('New password is required'),
});
