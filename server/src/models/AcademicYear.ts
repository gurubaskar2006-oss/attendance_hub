import mongoose, { Schema, Document } from 'mongoose';

export interface IAcademicYear extends Document {
  tenantId: string;
  name: string; // e.g. "2025-2026"
  startDate: Date;
  endDate: Date;
  isCurrent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AcademicYearSchema = new Schema<IAcademicYear>(
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
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    isCurrent: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to guarantee uniqueness of academic year name within a school tenant
AcademicYearSchema.index({ tenantId: 1, name: 1 }, { unique: true });

export const AcademicYear = mongoose.model<IAcademicYear>(
  'AcademicYear',
  AcademicYearSchema
);

