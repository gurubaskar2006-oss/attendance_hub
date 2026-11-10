import mongoose, { Schema, Document } from 'mongoose';

export interface ILicenseTransfer {
  transferredToSchoolName: string;
  transferredBy: mongoose.Types.ObjectId;
  date: Date;
  reason: string;
  previousTenantId: string;
}

export interface ISoftwareLicense extends Document {
  licenseKey: string;
  tenantId: string;
  schoolName: string;
  customerName: string;
  customerContact: {
    email: string;
    phone: string;
  };
  agreementReference: string;
  purchaseDate: Date;
  activationDate?: Date;
  status: 'PENDING_ACTIVATION' | 'ACTIVE' | 'SUSPENDED' | 'REVOKED';
  licenseType: 'PERMANENT';
  licensedModules: string[];
  tier: 'STANDARD' | 'PROFESSIONAL' | 'ENTERPRISE';
  limits: {
    maxStudents: number;
    maxStaff: number;
  };
  commercialServices: {
    annualMaintenanceContract: {
      active: boolean;
      startDate?: Date;
      validUntil?: Date;
      notes?: string;
    };
    cloudStorageAllocatedGb: number;
    smsCreditsPurchased: number;
    smsCreditsUsed: number;
    whatsappCreditsPurchased: number;
    whatsappCreditsUsed: number;
  };
  transferHistory: ILicenseTransfer[];
  createdAt: Date;
  updatedAt: Date;
}

const SoftwareLicenseSchema = new Schema<ISoftwareLicense>(
  {
    licenseKey: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    tenantId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    schoolName: { type: String, required: true, trim: true },
    customerName: { type: String, required: true, trim: true },
    customerContact: {
      email: { type: String, required: true, trim: true, lowercase: true },
      phone: { type: String, required: true, trim: true },
    },
    agreementReference: { type: String, required: true, trim: true },
    purchaseDate: { type: Date, required: true, default: Date.now },
    activationDate: { type: Date },
    status: {
      type: String,
      enum: ['PENDING_ACTIVATION', 'ACTIVE', 'SUSPENDED', 'REVOKED'],
      default: 'PENDING_ACTIVATION',
      index: true,
    },
    licenseType: {
      type: String,
      enum: ['PERMANENT'],
      default: 'PERMANENT',
    },
    licensedModules: {
      type: [String],
      default: [
        'ATTENDANCE',
        'STUDENTS',
        'STAFF',
        'PARENTS',
        'EXAMINATIONS',
        'REPORTS',
        'LEAVE_MANAGEMENT',
        'ANNOUNCEMENTS',
        'NOTIFICATIONS',
      ],
    },
    tier: {
      type: String,
      enum: ['STANDARD', 'PROFESSIONAL', 'ENTERPRISE'],
      default: 'ENTERPRISE',
    },
    limits: {
      maxStudents: { type: Number, default: 2500 },
      maxStaff: { type: Number, default: 200 },
    },
    commercialServices: {
      annualMaintenanceContract: {
        active: { type: Boolean, default: true },
        startDate: { type: Date, default: Date.now },
        validUntil: {
          type: Date,
          default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
        notes: { type: String },
      },
      cloudStorageAllocatedGb: { type: Number, default: 20 },
      smsCreditsPurchased: { type: Number, default: 5000 },
      smsCreditsUsed: { type: Number, default: 0 },
      whatsappCreditsPurchased: { type: Number, default: 2000 },
      whatsappCreditsUsed: { type: Number, default: 0 },
    },
    transferHistory: [
      {
        transferredToSchoolName: { type: String, required: true },
        transferredBy: { type: Schema.Types.ObjectId, ref: 'User' },
        date: { type: Date, default: Date.now },
        reason: { type: String, required: true },
        previousTenantId: { type: String, required: true },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const SoftwareLicense = mongoose.model<ISoftwareLicense>(
  'SoftwareLicense',
  SoftwareLicenseSchema
);

