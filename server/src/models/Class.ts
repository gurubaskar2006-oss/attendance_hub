import mongoose, { Schema, Document } from 'mongoose';

export interface IClass extends Document {
  tenantId: string;
  name: string; // e.g. "Class 10" or "Grade 10"
  gradeLevel: number; // e.g. 10
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const ClassSchema = new Schema<IClass>(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    gradeLevel: {
      type: Number,
      required: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Unique class name per school tenant
ClassSchema.index({ tenantId: 1, name: 1 }, { unique: true });

export const Class = mongoose.model<IClass>('Class', ClassSchema);

