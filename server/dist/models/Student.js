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
exports.Student = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const StudentSchema = new mongoose_1.Schema({
    tenantId: {
        type: String,
        required: true,
        index: true,
    },
    admissionNumber: {
        type: String,
        required: true,
        trim: true,
        uppercase: true,
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
    dateOfBirth: {
        type: Date,
        required: true,
    },
    gender: {
        type: String,
        enum: ['MALE', 'FEMALE', 'OTHER'],
        required: true,
    },
    academicYearId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'AcademicYear',
        required: true,
        index: true,
    },
    classId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Class',
        required: true,
        index: true,
    },
    sectionId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Section',
        required: true,
        index: true,
    },
    rollNumber: {
        type: String,
        trim: true,
    },
    admissionDate: {
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'TRANSFERRED', 'WITHDRAWN', 'GRADUATED'],
        default: 'ACTIVE',
        index: true,
    },
    bloodGroup: {
        type: String,
        trim: true,
    },
    photoUrl: {
        type: String,
    },
    address: {
        street: { type: String, trim: true },
        city: { type: String, trim: true },
        state: { type: String, trim: true },
        postalCode: { type: String, trim: true },
    },
    emergencyContact: {
        name: { type: String, trim: true },
        relationship: { type: String, trim: true },
        phone: { type: String, trim: true },
    },
}, {
    timestamps: true,
});
// Compound indexes
StudentSchema.index({ tenantId: 1, admissionNumber: 1 }, { unique: true });
StudentSchema.index({ tenantId: 1, classId: 1, sectionId: 1, status: 1 });
StudentSchema.index({ tenantId: 1, academicYearId: 1 });
StudentSchema.methods.fullName = function () {
    return `${this.firstName} ${this.lastName}`.trim();
};
exports.Student = mongoose_1.default.model('Student', StudentSchema);
