import mongoose, { Document, Schema } from 'mongoose';

export interface IProfessional extends Document {
  userId: mongoose.Types.ObjectId;
  industry: string;
  seniority: string;
  expertise: string[];
  hourlyRate: number;
  availability: {
    timezone: string;
    slots: {
      day: string;
      startTime: string;
      endTime: string;
    }[];
  };
  linkedInProfile: string;
  bio: string;
  isVerified: boolean;
  rating: number;
  totalSessions: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProfessionalSchema = new Schema<IProfessional>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  industry: { type: String, required: true },
  seniority: { type: String, required: true },
  expertise: [{ type: String }],
  hourlyRate: { type: Number, required: true },
  availability: {
    timezone: { type: String, required: true },
    slots: [{
      day: { type: String, required: true },
      startTime: { type: String, required: true },
      endTime: { type: String, required: true }
    }]
  },
  linkedInProfile: { type: String, required: true },
  bio: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  rating: { type: Number, default: 0 },
  totalSessions: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model<IProfessional>('Professional', ProfessionalSchema); 