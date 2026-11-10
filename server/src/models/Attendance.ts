import mongoose, { Schema, Document } from 'mongoose';

export type AttendanceStatus =
  | 'PRESENT'
  | 'ABSENT'
  | 'LATE'
  | 'HALF_DAY'
  | 'APPROVED_LEAVE';

export type AttendanceSession = 'FULL_DAY' | 'MORNING' | 'AFTERNOON';

export interface IAttendance extends Document {
  tenantId: string;
  academicYearId: mongoose.Types.ObjectId;
  classId: mongoose.Types.ObjectId;
  sectionId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  date: string; // ISO date format YYYY-MM-DD for deterministic querying
  session: AttendanceSession;
  status: AttendanceStatus;
  markedBy: mongoose.Types.ObjectId; // User ref (Teacher or Admin)
  remarks?: string;
  isLocked: boolean;
  lockedAt?: Date;
  notificationSent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>(
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
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
      index: true,
    },
    session: {
      type: String,
      enum: ['FULL_DAY', 'MORNING', 'AFTERNOON'],
      default: 'FULL_DAY',
    },
    status: {
      type: String,
      enum: ['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'APPROVED_LEAVE'],
      required: true,
      index: true,
    },
    markedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    remarks: {
      type: String,
      trim: true,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
    lockedAt: {
      type: Date,
    },
    notificationSent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// CRITICAL UNIQUE COMPOUND INDEX: Prevents duplicate attendance for the same student on the same date & session within a school
AttendanceSchema.index(
  { tenantId: 1, studentId: 1, date: 1, session: 1 },
  { unique: true }
);

// Index for class-level daily attendance queries
AttendanceSchema.index({
  tenantId: 1,
  classId: 1,
  sectionId: 1,
  date: 1,
  session: 1,
});

// Index for student attendance history & monthly analytics
AttendanceSchema.index({
  tenantId: 1,
  studentId: 1,
  date: 1,
});

export const Attendance = mongoose.model<IAttendance>(
  'Attendance',
  AttendanceSchema
);

