import mongoose, { Schema, Document } from 'mongoose';

export type RelationshipType = 'FATHER' | 'MOTHER' | 'LEGAL_GUARDIAN' | 'OTHER';

export interface IParentStudentRelationship extends Document {
  tenantId: string;
  parentId: mongoose.Types.ObjectId; // Parent ref
  studentId: mongoose.Types.ObjectId; // Student ref
  relationshipType: RelationshipType;
  isPrimaryContact: boolean;
  isVerified: boolean;
  verifiedBy?: mongoose.Types.ObjectId; // School Admin / Staff User ref
  verificationDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ParentStudentRelationshipSchema = new Schema<IParentStudentRelationship>(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Parent',
      required: true,
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    relationshipType: {
      type: String,
      enum: ['FATHER', 'MOTHER', 'LEGAL_GUARDIAN', 'OTHER'],
      default: 'FATHER',
    },
    isPrimaryContact: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: true, // Set to true by admin verification
      index: true,
    },
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    verificationDate: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index: unique parent-student pair within a school
ParentStudentRelationshipSchema.index(
  { tenantId: 1, parentId: 1, studentId: 1 },
  { unique: true }
);

ParentStudentRelationshipSchema.index({ tenantId: 1, studentId: 1 });

export const ParentStudentRelationship =
  mongoose.model<IParentStudentRelationship>(
    'ParentStudentRelationship',
    ParentStudentRelationshipSchema
  );

