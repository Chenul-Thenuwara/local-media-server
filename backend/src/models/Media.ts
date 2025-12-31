import mongoose, { Schema, Document } from 'mongoose';

export interface IMedia extends Document {
  filename: string;
  path: string;
  libraryId: mongoose.Types.ObjectId;
  type: 'movie' | 'tv';
  size: number;
  // Metadata
  title?: string;
  overview?: string;
  posterPath?: string;
  backdropPath?: string;
  releaseDate?: string;
  tmdbId?: number;
  createdAt: Date;
}

const MediaSchema: Schema = new Schema({
  filename: { type: String, required: true },
  path: { type: String, required: true },
  libraryId: { type: Schema.Types.ObjectId, ref: 'Library', required: true },
  type: { type: String, enum: ['movie', 'tv'], required: true },
  size: { type: Number, required: true },
  // Metadata fields
  title: { type: String },
  overview: { type: String },
  posterPath: { type: String },
  backdropPath: { type: String },
  releaseDate: { type: String },
  tmdbId: { type: Number },
}, { timestamps: true });

export default mongoose.model<IMedia>('Media', MediaSchema);
