import mongoose, { Schema, Document } from 'mongoose';

export interface IExaminationSubject extends Document {
  tenantId: string;
  examinationId: mongoose.Types.ObjectId;
  classId: mongoose.Types.ObjectId;
  subjectId: mongoose.Types.ObjectId;
  examDate?: string;
  maxMarks: number;
  passingMarks: number;
  createdAt: Date;
  updatedAt: Date;
}

const ExaminationSubjectSchema = new Schema<IExaminationSubject>(
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
    classId: {
      type: Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
      index: true,
    },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
      index: true,
    },
    examDate: {
      type: String,
    },
    maxMarks: {
      type: Number,
      required: true,
      default: 100,
    },
    passingMarks: {
      type: Number,
      required: true,
      default: 35,
    },
  },
  {
    timestamps: true,
  }
);

// Unique subject per examination and class
ExaminationSubjectSchema.index(
  { tenantId: 1, examinationId: 1, classId: 1, subjectId: 1 },
  { unique: true }
);

export const ExaminationSubject = mongoose.model<IExaminationSubject>(
  'ExaminationSubject',
  ExaminationSubjectSchema
);

