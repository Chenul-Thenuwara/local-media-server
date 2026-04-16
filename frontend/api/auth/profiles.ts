import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { VercelRequest, VercelResponse } from '@vercel/node';

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
  role: { type: String, default: 'admin' },
  avatar: { type: String },
  pin: { type: String },
  managedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

const connectDB = async () => {
  if (mongoose.connections[0].readyState) return;
  const mongoURI = process.env.MONGO_URI || 'mongodb+srv://chenul:Helsinki@lms-cluster.cwkzgk5.mongodb.net/?appName=lms-cluster';
  await mongoose.connect(mongoURI);
};

const JWT_SECRET = process.env.JWT_SECRET || '77536a4cec7993c131b13f18a786c3488da36159dccac301f4b73f0a95965545';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });

  // Verify token
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { user?: { id: string }; id?: string };
    const userId = decoded.user?.id || decoded.id;

    if (!userId) return res.status(401).json({ message: 'Invalid token' });

    await connectDB();

    const currentUser = await User.findById(userId);
    if (!currentUser) return res.status(404).json({ message: 'User not found' });

    const familyId = currentUser.managedBy || currentUser._id;

    const profiles = await User.find({
      $or: [{ _id: familyId }, { managedBy: familyId }]
    }).select('name avatar role managedBy pin');

    const formattedProfiles = profiles.map(p => ({
      id: p._id,
      name: p.name,
      avatar: p.avatar,
      role: p.role,
      isManaged: !!p.managedBy,
      hasPin: !!p.pin
    }));

    res.status(200).json(formattedProfiles);

  } catch (error: any) {
    console.error('Profiles Error:', error);
    res.status(500).json({ message: error.message || 'Server Error' });
  }
}
