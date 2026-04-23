import mongoose, { Schema, Document } from 'mongoose';

export interface ILibrary extends Document {
  name: string;
  path: string;
  type: 'movie' | 'tv' | 'music' | 'photo' | 'auto';
  userId: mongoose.Types.ObjectId;
  deviceId?: string;
}

const LibrarySchema: Schema = new Schema({
  name: { type: String, required: true },
  path: { type: String, required: true },
  type: { type: String, enum: ['movie', 'tv', 'music', 'photo', 'auto'], required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  deviceId: { type: String, required: false },
}, { timestamps: true });

export default mongoose.model<ILibrary>('Library', LibrarySchema);
