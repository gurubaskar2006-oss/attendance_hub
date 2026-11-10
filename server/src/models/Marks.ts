import mongoose, { Schema, Document } from 'mongoose';

export interface IMarksHistory {
  previousMarks?: number;
  newMarks: number;
  reason: string;
  updatedBy: mongoose.Types.ObjectId;
  date: Date;
}

export interface IMarks extends Document {
  tenantId: string;
  examinationId: mongoose.Types.ObjectId;
  examinationSubjectId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  marksObtained: number;
  isAbsent: boolean;
  grade?: string;
  remarks?: string;
  enteredBy: mongoose.Types.ObjectId;
  history: IMarksHistory[];
  createdAt: Date;
  updatedAt: Date;
}

const MarksSchema = new Schema<IMarks>(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
    },
    examinationId: {
      type: Schema.Types.ObjectId,
      ref: 'Examination',
      required: true,
      index: true,
    },
    examinationSubjectId: {
      type: Schema.Types.ObjectId,
      ref: 'ExaminationSubject',
      required: true,
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    marksObtained: {
      type: Number,
      required: true,
      default: 0,
    },
    isAbsent: {
      type: Boolean,
      default: false,
    },
    grade: {
      type: String,
      trim: true,
    },
    remarks: {
      type: String,
      trim: true,
    },
    enteredBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    history: [
      {
        previousMarks: { type: Number },
        newMarks: { type: Number, required: true },
        reason: { type: String, required: true },
        updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        date: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// CRITICAL UNIQUE COMPOUND INDEX: One mark record per student per exam-subject
MarksSchema.index(
  { tenantId: 1, examinationSubjectId: 1, studentId: 1 },
  { unique: true }
);

MarksSchema.index({ tenantId: 1, examinationId: 1, studentId: 1 });

export const Marks = mongoose.model<IMarks>('Marks', MarksSchema);

