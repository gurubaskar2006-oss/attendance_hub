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
exports.Staff = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const StaffSchema = new mongoose_1.Schema({
    tenantId: {
        type: String,
        required: true,
        index: true,
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    employeeId: {
        type: String,
        required: true,
        trim: true,
        uppercase: true,
    },
    staffType: {
        type: String,
        enum: ['TEACHING', 'NON_TEACHING', 'ADMINISTRATIVE'],
        default: 'TEACHING',
        index: true,
    },
    designation: {
        type: String,
        required: true,
        trim: true,
    },
    department: {
        type: String,
        trim: true,
    },
    qualification: {
        type: String,
        trim: true,
    },
    joiningDate: {
        type: Date,
        default: Date.now,
    },
    emergencyContact: {
        name: { type: String, trim: true },
        relationship: { type: String, trim: true },
        phone: { type: String, trim: true },
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true,
    },
}, {
    timestamps: true,
});
// Compound index: unique employeeId per school tenant
StaffSchema.index({ tenantId: 1, employeeId: 1 }, { unique: true });
StaffSchema.index({ tenantId: 1, userId: 1 }, { unique: true });
exports.Staff = mongoose_1.default.model('Staff', StaffSchema);
