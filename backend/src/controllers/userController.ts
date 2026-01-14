import { Request, Response } from 'express';
import User from '../models/User';

// @desc    Get current user profile
// @route   GET /api/user/profile
// @access  Private
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    // @ts-ignore
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      joinedAt: user.createdAt
    });
  } catch (error) {
    console.error('Get Profile Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user profile
// @route   PUT /api/user/profile
// @access  Private
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    // @ts-ignore
    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const { name, email } = req.body;

    if (name) user.name = name;
    if (email) user.email = email; // Note: In a real app, email change might require re-verification

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      token: req.headers.authorization?.split(' ')[1] // Return generic or same token
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Change password
// @route   PUT /api/user/profile/password
// @access  Private
export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    // @ts-ignore
    const user = await User.findById(req.user.id);

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Verify current password
    // The User model should have a method to compare password, but we'll use bcrypt directly if needed or the model method if exported
    // Checking User model... it has comparePassword
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      res.status(401).json({ message: 'Incorrect current password' });
      return;
    }

    user.password = newPassword; // The pre-save hook will hash this
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change Password Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
