import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'viewer' | 'guest';
  managedBy?: mongoose.Types.ObjectId;
  pin?: string;
  permissions?: {
    allowAdult: boolean;
    allowDelete: boolean;
    libraries: mongoose.Types.ObjectId[];
  };
  watchlist: {
    mediaId?: string;
    tmdbId?: number;
    mediaType: 'movie' | 'tv';
    title: string;
    posterPath?: string;
    addedAt: Date;
  }[];
  comparePassword(candidatePassword: string): Promise<boolean>;
  comparePin(candidatePin: string): Promise<boolean>;
  googleRefreshToken?: string;
  spotifyAccessToken?: string;
  spotifyRefreshToken?: string;
  spotifyTokenExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, sparse: true }, // Sparse allows multiple nulls
  password: { type: String }, // Optional for managed users
  pin: { type: String }, // Hashed PIN for managed users
  role: { type: String, enum: ['admin', 'viewer', 'guest'], default: 'viewer' },
  managedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  permissions: {
    allowAdult: { type: Boolean, default: false },
    allowDelete: { type: Boolean, default: false },
    libraries: [{ type: Schema.Types.ObjectId, ref: 'Library' }]
  },
  watchlist: [{
    mediaId: String,
    tmdbId: Number,
    mediaType: { type: String, enum: ['movie', 'tv'], required: true },
    title: { type: String, required: true },
    posterPath: String,
    addedAt: { type: Date, default: Date.now }
  }],
  googleRefreshToken: String,
  spotifyAccessToken: String,
  spotifyRefreshToken: String,
  spotifyTokenExpiry: Date,
}, { timestamps: true });

// Hash password before saving
// Hash password before saving
UserSchema.pre('save', async function (this: IUser) {
  try {
    const salt = await bcrypt.genSalt(10);

    if (this.isModified('password') && this.password) {
      this.password = await bcrypt.hash(this.password, salt);
    }

    if (this.isModified('pin') && this.pin) {
      this.pin = await bcrypt.hash(this.pin, salt);
    }
  } catch (err) {
    throw err;
  }
});

UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.comparePin = async function (candidatePin: string): Promise<boolean> {
  if (!this.pin) return false;
  return bcrypt.compare(candidatePin, this.pin);
};

export default mongoose.model<IUser>('User', UserSchema);
