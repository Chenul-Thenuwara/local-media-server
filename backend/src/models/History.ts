import mongoose, { Schema, Document } from 'mongoose';

export interface IHistory extends Document {
  userId: string;
  mediaId?: string; // Local ID
  tmdbId?: number;
  mediaType: 'movie' | 'tv';
  title: string;
  posterPath?: string;
  watchedAt: Date;
  progress?: number; // Optional: playback progress/duration
}

const HistorySchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  mediaId: { type: String },
  tmdbId: { type: Number },
  mediaType: { type: String, enum: ['movie', 'tv'], required: true },
  title: { type: String, required: true },
  posterPath: String,
  watchedAt: { type: Date, default: Date.now },
  progress: { type: Number, default: 0 }
}, { timestamps: true });

// Index for efficient querying of recent history
HistorySchema.index({ userId: 1, watchedAt: -1 });

export default mongoose.model<IHistory>('History', HistorySchema);
