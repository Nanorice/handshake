import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  linkedInId: string;
  firstName: string;
  lastName: string;
  profilePicture?: string;
  isProfessional: boolean;
  isAnonymous: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  linkedInId: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  profilePicture: { type: String },
  isProfessional: { type: Boolean, default: false },
  isAnonymous: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model<IUser>('User', UserSchema); 