import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole =
  | 'SUPER_ADMIN'
  | 'SCHOOL_ADMIN'
  | 'PRINCIPAL'
  | 'COORDINATOR'
  | 'TEACHER'
  | 'PARENT'
  | 'STAFF';

export interface IUser extends Document {
  tenantId: string; // 'PLATFORM' for Super Admin, school tenantId for others
  email: string;
  phone?: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  lastLogin?: Date;
  refreshToken?: string;
  refreshTokenHash?: string;
  revokedTokenHashes?: string[];
  permissions?: string[];
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  fullName(): string;
}

const UserSchema = new Schema<IUser>(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
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
    role: {
      type: String,
      enum: [
        'SUPER_ADMIN',
        'SCHOOL_ADMIN',
        'PRINCIPAL',
        'COORDINATOR',
        'TEACHER',
        'PARENT',
        'STAFF',
      ],
      required: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastLogin: {
      type: Date,
    },
    refreshToken: {
      type: String,
    },
    refreshTokenHash: {
      type: String,
    },
    revokedTokenHashes: {
      type: [String],
      default: [],
    },
    permissions: {
      type: [String],
      default: [],
    },
    avatarUrl: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure uniqueness of email within a tenant
UserSchema.index({ tenantId: 1, email: 1 }, { unique: true });
UserSchema.index({ tenantId: 1, role: 1 });

UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

UserSchema.methods.fullName = function (): string {
  return `${this.firstName} ${this.lastName}`.trim();
};

export const User = mongoose.model<IUser>('User', UserSchema);

