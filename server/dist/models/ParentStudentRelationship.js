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
exports.ParentStudentRelationship = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const ParentStudentRelationshipSchema = new mongoose_1.Schema({
    tenantId: {
        type: String,
        required: true,
        index: true,
    },
    parentId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Parent',
        required: true,
        index: true,
    },
    studentId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Student',
        required: true,
        index: true,
    },
    relationshipType: {
        type: String,
        enum: ['FATHER', 'MOTHER', 'LEGAL_GUARDIAN', 'OTHER'],
        default: 'FATHER',
    },
    isPrimaryContact: {
        type: Boolean,
        default: false,
    },
    isVerified: {
        type: Boolean,
        default: true, // Set to true by admin verification
        index: true,
    },
    verifiedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
    },
    verificationDate: {
        type: Date,
        default: Date.now,
    },
    notes: {
        type: String,
        trim: true,
    },
}, {
    timestamps: true,
});
// Compound index: unique parent-student pair within a school
ParentStudentRelationshipSchema.index({ tenantId: 1, parentId: 1, studentId: 1 }, { unique: true });
ParentStudentRelationshipSchema.index({ tenantId: 1, studentId: 1 });
exports.ParentStudentRelationship = mongoose_1.default.model('ParentStudentRelationship', ParentStudentRelationshipSchema);
