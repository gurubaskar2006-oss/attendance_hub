import mongoose, { Schema, Document } from 'mongoose';

export type NotificationChannel = 'PORTAL' | 'SMS' | 'WHATSAPP';
export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED' | 'SIMULATED';

export interface INotification extends Document {
  tenantId: string;
  recipientUserId?: mongoose.Types.ObjectId;
  recipientPhone?: string;
  recipientName: string;
  channel: NotificationChannel;
  event: 'ATTENDANCE_ABSENT' | 'ATTENDANCE_LATE' | 'LEAVE_STATUS' | 'EXAM_PUBLISHED' | 'ANNOUNCEMENT' | 'GENERAL';
  title: string;
  messageEn: string;
  messageTa?: string;
  status: NotificationStatus;
  providerResponse?: any;
  errorDetails?: string;
  studentId?: mongoose.Types.ObjectId;
  sentAt?: Date;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
    },
    recipientUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    recipientPhone: {
      type: String,
      trim: true,
    },
    recipientName: {
      type: String,
      required: true,
      trim: true,
    },
    channel: {
      type: String,
      enum: ['PORTAL', 'SMS', 'WHATSAPP'],
      default: 'PORTAL',
      index: true,
    },
    event: {
      type: String,
      enum: [
        'ATTENDANCE_ABSENT',
        'ATTENDANCE_LATE',
        'LEAVE_STATUS',
        'EXAM_PUBLISHED',
        'ANNOUNCEMENT',
        'GENERAL',
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    messageEn: {
      type: String,
      required: true,
    },
    messageTa: {
      type: String,
    },
    status: {
      type: String,
      enum: ['PENDING', 'SENT', 'FAILED', 'SIMULATED'],
      default: 'PENDING',
      index: true,
    },
    providerResponse: {
      type: Schema.Types.Mixed,
    },
    errorDetails: {
      type: String,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
    },
    sentAt: {
      type: Date,
    },
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

NotificationSchema.index({ tenantId: 1, recipientUserId: 1, readAt: 1 });
NotificationSchema.index({ tenantId: 1, status: 1 });

export const Notification = mongoose.model<INotification>(
  'Notification',
  NotificationSchema
);

