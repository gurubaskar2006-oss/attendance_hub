import mongoose, { Schema, Document } from 'mongoose';

export type ExamType =
  | 'UNIT_TEST'
  | 'QUARTERLY'
  | 'HALF_YEARLY'
  | 'ANNUAL'
  | 'CUSTOM';

export interface IExamination extends Document {
  tenantId: string;
  academicYearId: mongoose.Types.ObjectId;
  name: string; // e.g. "Term 1 Quarterly Examination 2025"
  examType: ExamType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  isPublished: boolean;
  publishedAt?: Date;
  publishedBy?: mongoose.Types.ObjectId;
  isLocked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ExaminationSchema = new Schema<IExamination>(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
    },
    academicYearId: {
      type: Schema.Types.ObjectId,
      ref: 'AcademicYear',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    examType: {
      type: String,
      enum: ['UNIT_TEST', 'QUARTERLY', 'HALF_YEARLY', 'ANNUAL', 'CUSTOM'],
      default: 'QUARTERLY',
    },
    startDate: {
      type: String,
      required: true,
    },
    endDate: {
      type: String,
      required: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
      index: true,
    },
    publishedAt: {
      type: Date,
    },
    publishedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

ExaminationSchema.index({ tenantId: 1, academicYearId: 1, name: 1 });

export const Examination = mongoose.model<IExamination>(
  'Examination',
  ExaminationSchema
);

