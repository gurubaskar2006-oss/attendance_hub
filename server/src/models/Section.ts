import mongoose, { Schema, Document } from 'mongoose';

export interface ISection extends Document {
  tenantId: string;
  classId: mongoose.Types.ObjectId;
  name: string; // e.g. "A", "B", "Rose"
  roomNumber?: string;
  capacity?: number;
  createdAt: Date;
  updatedAt: Date;
}

const SectionSchema = new Schema<ISection>(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
    },
    classId: {
      type: Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    roomNumber: {
      type: String,
      trim: true,
    },
    capacity: {
      type: Number,
      default: 45,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index: unique section name per class within a school tenant
SectionSchema.index({ tenantId: 1, classId: 1, name: 1 }, { unique: true });

export const Section = mongoose.model<ISection>('Section', SectionSchema);

