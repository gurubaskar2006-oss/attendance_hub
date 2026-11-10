import mongoose, { Schema, Document } from 'mongoose';

export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ILeaveRequest extends Document {
  tenantId: string;
  studentId: mongoose.Types.ObjectId;
  parentId: mongoose.Types.ObjectId; // User ref who submitted
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  totalDays: number;
  reason: string;
  attachmentUrl?: string;
  status: LeaveStatus;
  reviewedBy?: mongoose.Types.ObjectId; // User ref
  reviewRemarks?: string;
  reviewedAt?: Date;
  autoAttendanceMarked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LeaveRequestSchema = new Schema<ILeaveRequest>(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    startDate: {
      type: String,
      required: true,
    },
    endDate: {
      type: String,
      required: true,
    },
    totalDays: {
      type: Number,
      default: 1,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    attachmentUrl: {
      type: String,
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
      index: true,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewRemarks: {
      type: String,
      trim: true,
    },
    reviewedAt: {
      type: Date,
    },
    autoAttendanceMarked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

LeaveRequestSchema.index({ tenantId: 1, studentId: 1, status: 1 });
LeaveRequestSchema.index({ tenantId: 1, parentId: 1 });

export const LeaveRequest = mongoose.model<ILeaveRequest>(
  'LeaveRequest',
  LeaveRequestSchema
);

