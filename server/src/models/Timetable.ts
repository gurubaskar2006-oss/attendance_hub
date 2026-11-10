import mongoose, { Schema, Document } from 'mongoose';

export interface IPeriod {
  periodNumber: number;
  startTime: string; // "09:00"
  endTime: string;   // "09:45"
  subjectId: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  roomNumber?: string;
}

export interface ITimetable extends Document {
  tenantId: string;
  academicYearId: mongoose.Types.ObjectId;
  classId: mongoose.Types.ObjectId;
  sectionId: mongoose.Types.ObjectId;
  dayOfWeek: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';
  periods: IPeriod[];
  createdAt: Date;
  updatedAt: Date;
}

const PeriodSchema = new Schema<IPeriod>(
  {
    periodNumber: { type: Number, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
    teacherId: { type: Schema.Types.ObjectId, ref: 'Staff', required: true },
    roomNumber: { type: String, trim: true },
  },
  { _id: false }
);

const TimetableSchema = new Schema<ITimetable>(
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
    dayOfWeek: {
      type: String,
      enum: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'],
      required: true,
    },
    periods: [PeriodSchema],
  },
  {
    timestamps: true,
  }
);

TimetableSchema.index({ tenantId: 1, classId: 1, sectionId: 1, dayOfWeek: 1 }, { unique: true });
TimetableSchema.index({ tenantId: 1, 'periods.teacherId': 1, dayOfWeek: 1 });

export const Timetable = mongoose.model<ITimetable>('Timetable', TimetableSchema);

