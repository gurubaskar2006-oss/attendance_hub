import mongoose, { Schema, Document } from 'mongoose';

export interface IGradeScale {
  grade: string;
  minMarks: number;
  maxMarks: number;
  gradePoint?: number;
  remarks?: string;
}

export interface ITenant extends Document {
  tenantId: string;
  name: string;
  code: string;
  affiliation: 'CBSE' | 'ICSE' | 'STATE_BOARD' | 'MATRICULATION' | 'IB' | 'OTHER';
  registrationNumber?: string;
  address: {
    street?: string;
    city: string;
    state: string;
    postalCode?: string;
    country: string;
  };
  contact: {
    email: string;
    phone: string;
    website?: string;
  };
  logoUrl?: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'ONBOARDING' | 'INACTIVE';
  settings: {
    attendanceCutoffTime: string; // HH:mm
    sessionMode: 'FULL_DAY' | 'TWO_SESSIONS'; // morning and afternoon
    gradingSystem: 'LETTER_GRADE' | 'PERCENTAGE' | 'GPA';
    gradeScale: IGradeScale[];
    enableSms: boolean;
    enableWhatsapp: boolean;
    defaultNotificationLanguage: 'en' | 'ta';
    workingDays: string[];
    consecutiveAbsenceAlertThreshold: number; // e.g., 3 days triggers alert
  };
  createdAt: Date;
  updatedAt: Date;
}

const TenantSchema = new Schema<ITenant>(
  {
    tenantId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
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
      unique: true,
      uppercase: true,
      trim: true,
    },
    affiliation: {
      type: String,
      enum: ['CBSE', 'ICSE', 'STATE_BOARD', 'MATRICULATION', 'IB', 'OTHER'],
      default: 'CBSE',
    },
    registrationNumber: {
      type: String,
      trim: true,
    },
    address: {
      street: { type: String, trim: true },
      city: { type: String, required: true, trim: true },
      state: { type: String, required: true, trim: true },
      postalCode: { type: String, trim: true },
      country: { type: String, default: 'India', trim: true },
    },
    contact: {
      email: { type: String, required: true, trim: true, lowercase: true },
      phone: { type: String, required: true, trim: true },
      website: { type: String, trim: true },
    },
    logoUrl: { type: String },
    status: {
      type: String,
      enum: ['ACTIVE', 'SUSPENDED', 'ONBOARDING', 'INACTIVE'],
      default: 'ACTIVE',
      index: true,
    },
    settings: {
      attendanceCutoffTime: { type: String, default: '09:30' },
      sessionMode: {
        type: String,
        enum: ['FULL_DAY', 'TWO_SESSIONS'],
        default: 'FULL_DAY',
      },
      gradingSystem: {
        type: String,
        enum: ['LETTER_GRADE', 'PERCENTAGE', 'GPA'],
        default: 'LETTER_GRADE',
      },
      gradeScale: [
        {
          grade: { type: String, required: true },
          minMarks: { type: Number, required: true },
          maxMarks: { type: Number, required: true },
          gradePoint: { type: Number },
          remarks: { type: String },
        },
      ],
      enableSms: { type: Boolean, default: false },
      enableWhatsapp: { type: Boolean, default: false },
      defaultNotificationLanguage: {
        type: String,
        enum: ['en', 'ta'],
        default: 'en',
      },
      workingDays: {
        type: [String],
        default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      },
      consecutiveAbsenceAlertThreshold: { type: Number, default: 3 },
    },
  },
  {
    timestamps: true,
  }
);

export const Tenant = mongoose.model<ITenant>('Tenant', TenantSchema);

