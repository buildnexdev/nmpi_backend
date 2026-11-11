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
exports.submitRequest = submitRequest;
exports.trackRequest = trackRequest;
exports.listMyRequests = listMyRequests;
exports.listAllRequests = listAllRequests;
exports.updateRequestStatus = updateRequestStatus;
const yup = __importStar(require("yup"));
const requestService_1 = require("../services/requestService");
const response_1 = require("../utils/response");
const createRequestSchema = yup.object({
    name: yup.string().trim().required('Name is required'),
    mobile: yup.string().trim().min(10, 'Valid mobile number required').required('Mobile number is required'),
    district_id: yup.number().nullable().optional(),
    district_name: yup.string().nullable().optional(),
    category: yup.string().trim().required('Request category is required'),
    description: yup.string().trim().min(5, 'Please provide description').required('Description is required'),
    attachment_url: yup.string().nullable().optional(),
});
async function submitRequest(req, res, next) {
    try {
        const validated = await createRequestSchema.validate(req.body, { abortEarly: true });
        const userId = req.user?.id ? Number(req.user.id) : null;
        const result = await requestService_1.RequestService.createRequest({
            ...validated,
            user_id: userId,
        });
        return (0, response_1.sendSuccess)(res, 'Public service request submitted successfully', result, 201);
    }
    catch (err) {
        next(err);
    }
}
async function trackRequest(req, res, next) {
    try {
        const refNo = String(req.params.refNo || '').trim();
        const result = await requestService_1.RequestService.trackRequest(refNo);
        return (0, response_1.sendSuccess)(res, 'Request tracking information retrieved', result);
    }
    catch (err) {
        next(err);
    }
}
async function listMyRequests(req, res, next) {
    try {
        const userId = req.user?.id ? Number(req.user.id) : undefined;
        const mobile = req.query.mobile ? String(req.query.mobile).trim() : req.user?.mobile;
        const result = await requestService_1.RequestService.listUserRequests(userId, mobile);
        return (0, response_1.sendSuccess)(res, 'My requests retrieved', result);
    }
    catch (err) {
        next(err);
    }
}
async function listAllRequests(req, res, next) {
    try {
        const { status, search, page, limit } = req.query;
        const result = await requestService_1.RequestService.listAllRequests({
            status: status ? String(status) : undefined,
            search: search ? String(search) : undefined,
            page: page ? Number(page) : 1,
            limit: limit ? Number(limit) : 20,
        });
        return (0, response_1.sendSuccess)(res, 'All service requests retrieved', result);
    }
    catch (err) {
        next(err);
    }
}
async function updateRequestStatus(req, res, next) {
    try {
        const id = Number(req.params.id);
        const { status, notes } = req.body;
        if (!status)
            return (0, response_1.sendError)(res, 'Status is required', 'VALIDATION_ERROR', 400);
        const result = await requestService_1.RequestService.updateStatus(id, status, notes);
        return (0, response_1.sendSuccess)(res, 'Request status updated successfully', result);
    }
    catch (err) {
        next(err);
    }
}
