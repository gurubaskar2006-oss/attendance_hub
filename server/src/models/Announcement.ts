import mongoose, { Schema, Document } from 'mongoose';

export type AudienceType = 'ALL' | 'TEACHERS' | 'PARENTS' | 'CLASS';
export type PriorityLevel = 'NORMAL' | 'HIGH' | 'URGENT';

export interface IAnnouncement extends Document {
  tenantId: string;
  title: string;
  content: string;
  targetAudience: AudienceType;
  targetClassId?: mongoose.Types.ObjectId;
  priority: PriorityLevel;
  authorId: mongoose.Types.ObjectId;
  attachmentUrl?: string;
  attachmentName?: string;
  publishedAt: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AnnouncementSchema = new Schema<IAnnouncement>(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    targetAudience: {
      type: String,
      enum: ['ALL', 'TEACHERS', 'PARENTS', 'CLASS'],
      default: 'ALL',
      index: true,
    },
    targetClassId: {
      type: Schema.Types.ObjectId,
      ref: 'Class',
    },
    priority: {
      type: String,
      enum: ['NORMAL', 'HIGH', 'URGENT'],
      default: 'NORMAL',
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    attachmentUrl: {
      type: String,
    },
    attachmentName: {
      type: String,
    },
    publishedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    expiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

AnnouncementSchema.index({ tenantId: 1, targetAudience: 1, publishedAt: -1 });

export const Announcement = mongoose.model<IAnnouncement>(
  'Announcement',
  AnnouncementSchema
);

