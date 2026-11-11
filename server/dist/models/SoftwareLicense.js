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
exports.SoftwareLicense = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const SoftwareLicenseSchema = new mongoose_1.Schema({
    licenseKey: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true,
        index: true,
    },
    tenantId: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true,
        index: true,
    },
    schoolName: { type: String, required: true, trim: true },
    customerName: { type: String, required: true, trim: true },
    customerContact: {
        email: { type: String, required: true, trim: true, lowercase: true },
        phone: { type: String, required: true, trim: true },
    },
    agreementReference: { type: String, required: true, trim: true },
    purchaseDate: { type: Date, required: true, default: Date.now },
    activationDate: { type: Date },
    status: {
        type: String,
        enum: ['PENDING_ACTIVATION', 'ACTIVE', 'SUSPENDED', 'REVOKED'],
        default: 'PENDING_ACTIVATION',
        index: true,
    },
    licenseType: {
        type: String,
        enum: ['PERMANENT'],
        default: 'PERMANENT',
    },
    licensedModules: {
        type: [String],
        default: [
            'ATTENDANCE',
            'STUDENTS',
            'STAFF',
            'PARENTS',
            'EXAMINATIONS',
            'REPORTS',
            'LEAVE_MANAGEMENT',
            'ANNOUNCEMENTS',
            'NOTIFICATIONS',
        ],
    },
    tier: {
        type: String,
        enum: ['STANDARD', 'PROFESSIONAL', 'ENTERPRISE'],
        default: 'ENTERPRISE',
    },
    limits: {
        maxStudents: { type: Number, default: 2500 },
        maxStaff: { type: Number, default: 200 },
    },
    commercialServices: {
        annualMaintenanceContract: {
            active: { type: Boolean, default: true },
            startDate: { type: Date, default: Date.now },
            validUntil: {
                type: Date,
                default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            },
            notes: { type: String },
        },
        cloudStorageAllocatedGb: { type: Number, default: 20 },
        smsCreditsPurchased: { type: Number, default: 5000 },
        smsCreditsUsed: { type: Number, default: 0 },
        whatsappCreditsPurchased: { type: Number, default: 2000 },
        whatsappCreditsUsed: { type: Number, default: 0 },
    },
    transferHistory: [
        {
            transferredToSchoolName: { type: String, required: true },
            transferredBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
            date: { type: Date, default: Date.now },
            reason: { type: String, required: true },
            previousTenantId: { type: String, required: true },
        },
    ],
}, {
    timestamps: true,
});
exports.SoftwareLicense = mongoose_1.default.model('SoftwareLicense', SoftwareLicenseSchema);
