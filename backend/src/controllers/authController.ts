import { Request, Response } from 'express';
import User from '../models/User';
import jwt from 'jsonwebtoken';

const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret123', {
    expiresIn: '30d',
  });
};

export const register = async (req: Request, res: Response): Promise<void> => {
  const { name, email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    user = new User({ name, email, password });
    await user.save();

    res.status(201).json({
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user.id),
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      res.status(400).json({ message: 'Invalid Credentials' });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(400).json({ message: 'Invalid Credentials' });
      return;
    }

    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user.id),
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }

  export const getProfiles = async (req: Request, res: Response) => {
    try {
      // @ts-ignore
      const userId = req.user._id;

      // Determine the "Family ID" (Main Account ID)
      // @ts-ignore
      const familyId = req.user.managedBy || req.user._id;

      // Find all profiles in this family (The Main User + All Users managed by them)
      const profiles = await User.find({
        $or: [
          { _id: familyId },
          { managedBy: familyId }
        ]
      }).select('name avatar role managedBy pin');

      // Return friendly format
      const formattedProfiles = profiles.map(p => ({
        id: p._id,
        name: p.name,
        avatar: (p as any).avatar,
        role: p.role,
        isManaged: !!p.managedBy,
        hasPin: !!p.pin
      }));

      res.json(formattedProfiles);
    } catch (error) {
      console.error('Get Profiles Error:', error);
      res.status(500).json({ message: 'Server Error' });
    }
  };

  export const switchProfile = async (req: Request, res: Response) => {
    try {
      const { profileId, pin } = req.body;
      // @ts-ignore
      const mainUserId = req.user._id;

      const targetProfile = await User.findById(profileId);

      if (!targetProfile) {
        return res.status(404).json({ message: 'Profile not found' });
      }

      // Security Check: Are we in the same family?
      // @ts-ignore
      const currentFamilyId = (req.user.managedBy || req.user._id).toString();
      const targetFamilyId = (targetProfile.managedBy || targetProfile._id).toString();

      if (currentFamilyId !== targetFamilyId) {
        return res.status(403).json({ message: 'Not authorized to access this profile' });
      }

      // PIN Check
      if (targetProfile.pin) {
        if (!pin) return res.status(400).json({ message: 'PIN required', requirePin: true });

        const isPinMatch = await targetProfile.comparePin(pin);
        if (!isPinMatch) {
          return res.status(401).json({ message: 'Invalid PIN' });
        }
      }

      // Generate new token for the target profile
      res.json({
        token: generateToken(targetProfile.id),
        user: {
          id: targetProfile._id,
          name: targetProfile.name,
          role: targetProfile.role,
          isManaged: !!targetProfile.managedBy
        }
      });

    } catch (error) {
      console.error('Switch Profile Error:', error);
      res.status(500).json({ message: 'Server Error' });
    }
  };
