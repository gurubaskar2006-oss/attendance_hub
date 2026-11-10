import mongoose, { Schema, Document } from 'mongoose';

export interface ISubject extends Document {
  tenantId: string;
  name: string; // e.g. "Mathematics", "Science", "Tamil", "English"
  code: string; // e.g. "MAT101"
  isElective: boolean;
  department?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SubjectSchema = new Schema<ISubject>(
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
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    isElective: {
      type: Boolean,
      default: false,
    },
    department: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index: unique subject code within a tenant
SubjectSchema.index({ tenantId: 1, code: 1 }, { unique: true });

export const Subject = mongoose.model<ISubject>('Subject', SubjectSchema);

