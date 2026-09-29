import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { VercelRequest, VercelResponse } from '@vercel/node';

interface IUser extends mongoose.Document {
  email: string;
  name: string;
  password?: string;
  role: string;
  avatar?: string;
  pin?: string;
  managedBy?: mongoose.Types.ObjectId;
}

const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true, sparse: true },
  name: { type: String, required: true },
  password: { type: String },
  role: { type: String, default: 'viewer' },
  avatar: { type: String },
  pin: { type: String },
  managedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  const mongoURI = process.env.MONGO_URI || '';
  if (!mongoURI) throw new Error('MONGO_URI environment variable is missing');
  await mongoose.connect(mongoURI);
};

const JWT_SECRET = process.env.JWT_SECRET || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    if (!JWT_SECRET) throw new Error('JWT_SECRET environment variable is missing');

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { user?: { id: string }; id?: string };
    const tokenUserId = decoded.user?.id || decoded.id;

    if (!tokenUserId) return res.status(401).json({ message: 'Invalid token' });

    await connectDB();

    const currentUser = await User.findById(tokenUserId);
    if (!currentUser) return res.status(404).json({ message: 'User not found' });

    const { profileId, pin, password } = req.body;
    if (!profileId) return res.status(400).json({ message: 'profileId is required' });

    const targetProfile = await User.findById(profileId);
    if (!targetProfile) return res.status(404).json({ message: 'Profile not found' });

    // Validate both profiles belong to the same family
    const currentFamilyId = (currentUser.managedBy || currentUser._id).toString();
    const targetFamilyId = (targetProfile.managedBy || targetProfile._id).toString();

    if (currentFamilyId !== targetFamilyId) {
      return res.status(403).json({ message: 'Not authorized to access this profile' });
    }

    // Check PIN or Password
    if (targetProfile.pin) {
      if (!pin) return res.status(400).json({ message: 'PIN required', requirePin: true });
      const isPinMatch = await bcrypt.compare(pin, targetProfile.pin);
      if (!isPinMatch) {
        return res.status(401).json({ message: 'Invalid PIN' });
      }
    } else if (!targetProfile.managedBy && targetProfile.password) {
      if (tokenUserId.toString() !== targetProfile._id.toString()) {
        if (!password) return res.status(400).json({ message: 'Password required', requirePassword: true });
        const isPasswordMatch = await bcrypt.compare(password, targetProfile.password);
        if (!isPasswordMatch) {
          return res.status(401).json({ message: 'Invalid Password' });
        }
      }
    }

    const newToken = jwt.sign({ user: { id: targetProfile.id } }, JWT_SECRET, { expiresIn: '7d' });

    return res.status(200).json({
      token: newToken,
      user: {
        id: targetProfile._id,
        name: targetProfile.name,
        role: targetProfile.role,
        isManaged: !!targetProfile.managedBy,
      },
    });
  } catch (error: unknown) {
    console.error('Vercel Switch Profile Error:', error);
    return res.status(500).json({ message: 'Server Error' });
  }
}
