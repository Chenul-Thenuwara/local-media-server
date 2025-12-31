import mongoose, { Schema, Document } from 'mongoose';

export interface ILibrary extends Document {
  name: string;
  path: string;
  type: 'movies' | 'tv';
  userId: mongoose.Types.ObjectId;
}

const LibrarySchema: Schema = new Schema({
  name: { type: String, required: true },
  path: { type: String, required: true },
  type: { type: String, enum: ['movies', 'tv'], required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

export default mongoose.model<ILibrary>('Library', LibrarySchema);
