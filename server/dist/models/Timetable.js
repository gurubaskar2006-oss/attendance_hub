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
exports.Timetable = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const PeriodSchema = new mongoose_1.Schema({
    periodNumber: { type: Number, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    subjectId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Subject', required: true },
    teacherId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Staff', required: true },
    roomNumber: { type: String, trim: true },
}, { _id: false });
const TimetableSchema = new mongoose_1.Schema({
    tenantId: {
        type: String,
        required: true,
        index: true,
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
    dayOfWeek: {
        type: String,
        enum: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'],
        required: true,
    },
    periods: [PeriodSchema],
}, {
    timestamps: true,
});
TimetableSchema.index({ tenantId: 1, classId: 1, sectionId: 1, dayOfWeek: 1 }, { unique: true });
TimetableSchema.index({ tenantId: 1, 'periods.teacherId': 1, dayOfWeek: 1 });
exports.Timetable = mongoose_1.default.model('Timetable', TimetableSchema);
