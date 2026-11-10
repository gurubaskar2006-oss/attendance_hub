import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  tenantId: string;
  userId?: mongoose.Types.ObjectId;
  userEmail?: string;
  userRole?: string;
  action: string; // e.g. 'ATTENDANCE_SUBMITTED', 'LICENSE_ISSUED', 'STUDENT_CREATED', 'CROSS_TENANT_BLOCKED'
  entity: string; // e.g. 'Attendance', 'SoftwareLicense', 'Student'
  entityId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  status: 'SUCCESS' | 'WARNING' | 'DENIED' | 'FAILED';
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    userEmail: {
      type: String,
      trim: true,
    },
    userRole: {
      type: String,
      trim: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    entity: {
      type: String,
      required: true,
      index: true,
    },
    entityId: {
      type: String,
    },
    details: {
      type: Schema.Types.Mixed,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'WARNING', 'DENIED', 'FAILED'],
      default: 'SUCCESS',
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

AuditLogSchema.index({ tenantId: 1, createdAt: -1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

