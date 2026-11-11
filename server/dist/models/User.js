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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const UserSchema = new mongoose_1.Schema({
    tenantId: {
        type: String,
        required: true,
        index: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
    },
    phone: {
        type: String,
        trim: true,
    },
    passwordHash: {
        type: String,
        required: true,
    },
    firstName: {
        type: String,
        required: true,
        trim: true,
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
    },
    role: {
        type: String,
        enum: [
            'SUPER_ADMIN',
            'SCHOOL_ADMIN',
            'PRINCIPAL',
            'COORDINATOR',
            'TEACHER',
            'PARENT',
            'STAFF',
        ],
        required: true,
        index: true,
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true,
    },
    lastLogin: {
        type: Date,
    },
    refreshToken: {
        type: String,
    },
    refreshTokenHash: {
        type: String,
    },
    revokedTokenHashes: {
        type: [String],
        default: [],
    },
    permissions: {
        type: [String],
        default: [],
    },
    avatarUrl: {
        type: String,
    },
}, {
    timestamps: true,
});
// Compound index to ensure uniqueness of email within a tenant
UserSchema.index({ tenantId: 1, email: 1 }, { unique: true });
UserSchema.index({ tenantId: 1, role: 1 });
UserSchema.methods.comparePassword = async function (candidatePassword) {
    return bcryptjs_1.default.compare(candidatePassword, this.passwordHash);
};
UserSchema.methods.fullName = function () {
    return `${this.firstName} ${this.lastName}`.trim();
};
exports.User = mongoose_1.default.model('User', UserSchema);
