import mongoose, { Schema, Document } from 'mongoose';

export interface ISettings extends Document {
  serverName: string;
  transcodingEnabled: boolean;
  hardwareAcceleration: boolean;
  maintenanceMode: boolean;
  language: string;
  updatedAt: Date;
}

const SettingsSchema: Schema = new Schema({
  serverName: { type: String, default: 'My Media Server' },
  transcodingEnabled: { type: Boolean, default: true },
  hardwareAcceleration: { type: Boolean, default: false },
  maintenanceMode: { type: Boolean, default: false },
  language: { type: String, default: 'en-US' }
}, {
  timestamps: true
});

// Ensure we only ever have one document or easy access
SettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

export default mongoose.model<ISettings>('Settings', SettingsSchema);
