import mongoose, { Schema, Document } from 'mongoose';

export interface IStudent extends Document {
  tenantId: string;
  admissionNumber: string; // Unique per school
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  academicYearId: mongoose.Types.ObjectId;
  classId: mongoose.Types.ObjectId;
  sectionId: mongoose.Types.ObjectId;
  rollNumber?: string;
  admissionDate: Date;
  status: 'ACTIVE' | 'TRANSFERRED' | 'WITHDRAWN' | 'GRADUATED';
  bloodGroup?: string;
  photoUrl?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  };
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  createdAt: Date;
  updatedAt: Date;
  fullName(): string;
}

const StudentSchema = new Schema<IStudent>(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
    },
    admissionNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    gender: {
      type: String,
      enum: ['MALE', 'FEMALE', 'OTHER'],
      required: true,
    },
    academicYearId: {
      type: Schema.Types.ObjectId,
      ref: 'AcademicYear',
      required: true,
      index: true,
    },
    classId: {
      type: Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
      index: true,
    },
    sectionId: {
      type: Schema.Types.ObjectId,
      ref: 'Section',
      required: true,
      index: true,
    },
    rollNumber: {
      type: String,
      trim: true,
    },
    admissionDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'TRANSFERRED', 'WITHDRAWN', 'GRADUATED'],
      default: 'ACTIVE',
      index: true,
    },
    bloodGroup: {
      type: String,
      trim: true,
    },
    photoUrl: {
      type: String,
    },
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      postalCode: { type: String, trim: true },
    },
    emergencyContact: {
      name: { type: String, trim: true },
      relationship: { type: String, trim: true },
      phone: { type: String, trim: true },
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
StudentSchema.index({ tenantId: 1, admissionNumber: 1 }, { unique: true });
StudentSchema.index({ tenantId: 1, classId: 1, sectionId: 1, status: 1 });
StudentSchema.index({ tenantId: 1, academicYearId: 1 });

StudentSchema.methods.fullName = function (): string {
  return `${this.firstName} ${this.lastName}`.trim();
};

export const Student = mongoose.model<IStudent>('Student', StudentSchema);

