import mongoose, { Document, Schema } from 'mongoose';

export interface ICoffeeChat extends Document {
  seekerId: mongoose.Types.ObjectId;
  professionalId: mongoose.Types.ObjectId;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  scheduledTime: Date;
  duration: number; // in minutes
  price: number;
  paymentIntentId: string;
  preferences: {
    industry: string;
    seniority: string;
    topics: string[];
  };
  feedback?: {
    rating: number;
    comment: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const CoffeeChatSchema = new Schema<ICoffeeChat>({
  seekerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  professionalId: { type: Schema.Types.ObjectId, ref: 'Professional', required: true },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending'
  },
  scheduledTime: { type: Date, required: true },
  duration: { type: Number, required: true },
  price: { type: Number, required: true },
  paymentIntentId: { type: String, required: true },
  preferences: {
    industry: { type: String, required: true },
    seniority: { type: String, required: true },
    topics: [{ type: String }]
  },
  feedback: {
    rating: { type: Number, min: 1, max: 5 },
    comment: { type: String }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model<ICoffeeChat>('CoffeeChat', CoffeeChatSchema); 