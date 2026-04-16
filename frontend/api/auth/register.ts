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
  role: { type: String, default: 'admin' }, // First user is usually admin
});

const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

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
    const { email, password, name } = req.body;

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({ email, name, password: hashedPassword });
    await user.save();

    const JWT_SECRET = process.env.JWT_SECRET || '77536a4cec7993c131b13f18a786c3488da36159dccac301f4b73f0a95965545';
    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    let device = await Device.findOne().sort({ lastSeen: -1 });

    res.status(201).json({
      token,
      tunnelUrl: device ? device.tunnelUrl : '',
      user: { id: user.id, email: user.email, name: user.name }
    });

  } catch (error: any) {
    console.error('Registration Error:', error);
    res.status(500).json({ message: error.message || 'Internal Server Error', stack: error.stack });
  }
}
