import mongoose, { Schema, Document } from 'mongoose';

export type StaffType = 'TEACHING' | 'NON_TEACHING' | 'ADMINISTRATIVE';

export interface IStaff extends Document {
  tenantId: string;
  userId: mongoose.Types.ObjectId; // User ref
  employeeId: string; // Unique per school
  staffType: StaffType;
  designation: string; // e.g. "Senior Mathematics Teacher", "Principal", "Academic Coordinator"
  department?: string; // e.g. "Science", "Humanities"
  qualification?: string;
  joiningDate: Date;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  salaryDetails?: {
    bankAccount?: string;
    ifscCode?: string;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const StaffSchema = new Schema<IStaff>(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    employeeId: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    staffType: {
      type: String,
      enum: ['TEACHING', 'NON_TEACHING', 'ADMINISTRATIVE'],
      default: 'TEACHING',
      index: true,
    },
    designation: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      trim: true,
    },
    qualification: {
      type: String,
      trim: true,
    },
    joiningDate: {
      type: Date,
      default: Date.now,
    },
    emergencyContact: {
      name: { type: String, trim: true },
      relationship: { type: String, trim: true },
      phone: { type: String, trim: true },
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index: unique employeeId per school tenant
StaffSchema.index({ tenantId: 1, employeeId: 1 }, { unique: true });
StaffSchema.index({ tenantId: 1, userId: 1 }, { unique: true });

export const Staff = mongoose.model<IStaff>('Staff', StaffSchema);

