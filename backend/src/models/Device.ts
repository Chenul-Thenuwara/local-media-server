import mongoose, { Schema, Document } from 'mongoose';

export interface IDevice extends Document {
  deviceId: string;
  name: string;
  tunnelUrl: string;
  ownerId?: mongoose.Types.ObjectId;  // Null until claimed by a user
  lastSeen: Date;
}

const DeviceSchema: Schema = new Schema({
  deviceId: { type: String, required: true, unique: true },
  name: { type: String, default: 'My Media Server' },
  tunnelUrl: { type: String, required: true },
  ownerId: { type: Schema.Types.ObjectId, ref: 'User' },
  lastSeen: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model<IDevice>('Device', DeviceSchema);
