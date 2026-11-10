import mongoose, { Schema, Document } from 'mongoose';

export interface ITeacherAssignment extends Document {
  tenantId: string;
  teacherId: mongoose.Types.ObjectId; // User ref
  academicYearId: mongoose.Types.ObjectId;
  classId: mongoose.Types.ObjectId;
  sectionId: mongoose.Types.ObjectId;
  subjectId?: mongoose.Types.ObjectId; // Optional: null if class teacher only
  isClassTeacher: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TeacherAssignmentSchema = new Schema<ITeacherAssignment>(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
    },
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
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
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
    },
    isClassTeacher: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for fast teacher lookups and preventing duplicate class teacher assignment
TeacherAssignmentSchema.index({
  tenantId: 1,
  teacherId: 1,
  academicYearId: 1,
});

TeacherAssignmentSchema.index({
  tenantId: 1,
  classId: 1,
  sectionId: 1,
  subjectId: 1,
  academicYearId: 1,
});

export const TeacherAssignment = mongoose.model<ITeacherAssignment>(
  'TeacherAssignment',
  TeacherAssignmentSchema
);

