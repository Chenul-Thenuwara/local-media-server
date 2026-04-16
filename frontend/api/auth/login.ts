import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { VercelRequest, VercelResponse } from '@vercel/node';

interface IUser extends mongoose.Document {
  email: string;
  name: string;
  password?: string;
  role: string;
}

const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true, sparse: true },
  name: { type: String, required: true },
  password: { type: String },
  role: { type: String, default: 'admin' },
});
const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

// Inline Device Model
interface IDevice extends mongoose.Document {
  deviceId: string;
  tunnelUrl: string;
  ownerId?: mongoose.Types.ObjectId;
}

const DeviceSchema = new mongoose.Schema({
  deviceId: { type: String, required: true, unique: true },
  tunnelUrl: { type: String, required: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});
const Device = mongoose.models.Device || mongoose.model<IDevice>('Device', DeviceSchema);

const connectDB = async () => {
  if (mongoose.connections[0].readyState) return;
  const mongoURI = process.env.MONGO_URI || 'mongodb+srv://chenul:Helsinki@lms-cluster.cwkzgk5.mongodb.net/?appName=lms-cluster';
  await mongoose.connect(mongoURI);
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !user.password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Look for a device assigned to this user (or just any device since there is likely only one server right now)
    // For MVP, if we don't have ownerId perfectly mapped yet, we can fallback to the most recent Device.
    // In production, we'd do: Device.findOne({ ownerId: user._id })
    let device = await Device.findOne({ ownerId: user._id });
    
    // If no device is explicitly claimed by this user yet, just grab the most recently active device 
    // (Helpful for the single-user local media server use case).
    if (!device) {
      device = await Device.findOne().sort({ lastSeen: -1 });
    }

    // If no device found, still log in but with no tunnelUrl
    // The frontend will handle showing the "server offline" screen
    const tunnelUrl = device?.tunnelUrl || null;

    // Generate standard token used by frontend
    const JWT_SECRET = process.env.JWT_SECRET || '77536a4cec7993c131b13f18a786c3488da36159dccac301f4b73f0a95965545';
    const payload = {
      user: {
        id: user.id
      }
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    console.log('Discovery Success. Pointing user to:', device.tunnelUrl);

    res.status(200).json({
      token,
      tunnelUrl,
      user: { id: user.id, email: user.email }
    });

  } catch (error) {
    console.error('Discovery Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
