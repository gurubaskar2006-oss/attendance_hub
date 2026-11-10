import mongoose, { Schema, Document } from 'mongoose';
import { AttendanceStatus } from './Attendance';

export interface IAttendanceCorrection extends Document {
  tenantId: string;
  attendanceId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  date: string;
  previousStatus: AttendanceStatus;
  newStatus: AttendanceStatus;
  reason: string;
  correctedBy: mongoose.Types.ObjectId; // User ref
  createdAt: Date;
}

const AttendanceCorrectionSchema = new Schema<IAttendanceCorrection>(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
    },
    attendanceId: {
      type: Schema.Types.ObjectId,
      ref: 'Attendance',
      required: true,
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
      index: true,
    },
    previousStatus: {
      type: String,
      required: true,
    },
    newStatus: {
      type: String,
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    correctedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

AttendanceCorrectionSchema.index({ tenantId: 1, attendanceId: 1 });
AttendanceCorrectionSchema.index({ tenantId: 1, studentId: 1 });

export const AttendanceCorrection = mongoose.model<IAttendanceCorrection>(
  'AttendanceCorrection',
  AttendanceCorrectionSchema
);

