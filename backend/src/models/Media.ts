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
  // Media Info
  mediaInfo?: {
    resolution?: '4K' | '1080p' | '720p' | 'SD';
    videoCodec?: string;
    audioCodec?: string;
    isHdr?: boolean;
    audioChannels?: number;
  };
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
  mediaInfo: {
    resolution: { type: String, enum: ['4K', '1080p', '720p', 'SD'] },
    videoCodec: { type: String },
    audioCodec: { type: String },
    isHdr: { type: Boolean },
    audioChannels: { type: Number },
  }
}, { timestamps: true });

export default mongoose.model<IMedia>('Media', MediaSchema);
