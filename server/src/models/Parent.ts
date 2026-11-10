import mongoose, { Schema, Document } from 'mongoose';

export interface IParent extends Document {
  tenantId: string;
  userId: mongoose.Types.ObjectId; // User ref
  occupation?: string;
  alternatePhone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  };
  preferredLanguage: 'en' | 'ta'; // English or Tamil
  communicationConsent: {
    sms: boolean;
    whatsapp: boolean;
    email: boolean;
    consentDate: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ParentSchema = new Schema<IParent>(
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
    occupation: {
      type: String,
      trim: true,
    },
    alternatePhone: {
      type: String,
      trim: true,
    },
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      postalCode: { type: String, trim: true },
    },
    preferredLanguage: {
      type: String,
      enum: ['en', 'ta'],
      default: 'en',
    },
    communicationConsent: {
      sms: { type: Boolean, default: true },
      whatsapp: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
      consentDate: { type: Date, default: Date.now },
    },
  },
  {
    timestamps: true,
  }
);

// Compound index: unique parent profile per user within a school tenant
ParentSchema.index({ tenantId: 1, userId: 1 }, { unique: true });

export const Parent = mongoose.model<IParent>('Parent', ParentSchema);

