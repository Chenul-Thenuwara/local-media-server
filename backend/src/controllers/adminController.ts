import { Request, Response } from 'express';
import os from 'os';
import User from '../models/User';
import Library from '../models/Library';
import Media from '../models/Media';

export const getSystemStats = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const currentUserId = req.user.id;

    // Count only users managed by this user (+ themselves)
    const userCount = await User.countDocuments({
      $or: [{ _id: currentUserId }, { managedBy: currentUserId }]
    });

    // Only look at THIS user's libraries
    const libraries = await Library.find({ userId: currentUserId }, 'name type createdAt');
    const libraryIds = libraries.map(lib => lib._id);
    const libraryCount = libraries.length;

    // Fetch recent media only from this user's libraries
    const recentMedia = await Media.find({ libraryId: { $in: libraryIds } }, 'title filename type createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    // Aggregate size/counts scoped to this user's libraries
    const mediaStats = await Media.aggregate([
      { $match: { libraryId: { $in: libraryIds } } },
      {
        $group: {
          _id: null,
          totalSize: { $sum: '$size' },
          totalCount: { $sum: 1 },
          moviesCount: { $sum: { $cond: [{ $eq: ['$type', 'movie'] }, 1, 0] } },
          tvCount: { $sum: { $cond: [{ $eq: ['$type', 'tv'] }, 1, 0] } }
        }
      }
    ]);

    const stats = mediaStats[0] || { totalSize: 0, totalCount: 0, moviesCount: 0, tvCount: 0 };
    const storageUsed = (stats.totalSize / (1024 * 1024 * 1024)).toFixed(2) + ' GB';

    const timeAgo = (date: Date) => {
      if (!date) return 'Just now';
      const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
      let interval = seconds / 31536000;
      if (interval > 1) return Math.floor(interval) + ' years ago';
      interval = seconds / 2592000;
      if (interval > 1) return Math.floor(interval) + ' months ago';
      interval = seconds / 86400;
      if (interval > 1) return Math.floor(interval) + ' days ago';
      interval = seconds / 3600;
      if (interval > 1) return Math.floor(interval) + ' hours ago';
      interval = seconds / 60;
      if (interval > 1) return Math.floor(interval) + ' mins ago';
      return 'Just now';
    };

    // Activity: recent media + this user's libraries
    const activityList = [
      ...recentMedia.map(m => ({
        id: m._id,
        title: `Added: ${m.title || m.filename}`,
        time: timeAgo(m.createdAt),
        type: m.type,
        timestamp: m.createdAt ? new Date(m.createdAt).getTime() : 0
      })),
      ...libraries.map(lib => ({
        id: lib._id,
        title: `Library: ${lib.name}`,
        time: lib.createdAt ? `Created ${timeAgo(lib.createdAt as Date)}` : 'Active',
        type: 'library',
        timestamp: lib.createdAt ? new Date(lib.createdAt).getTime() : 0
      }))
    ].sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);

    // RAM Usage
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMemGB = ((totalMem - freeMem) / (1024 * 1024 * 1024)).toFixed(2);
    const totalMemGB = (totalMem / (1024 * 1024 * 1024)).toFixed(2);

    // Local IP
    const nets = os.networkInterfaces();
    let localIp = 'localhost';
    for (const name of Object.keys(nets)) {
      for (const net of nets[name] || []) {
        if (net.family === 'IPv4' && !net.internal) {
          localIp = net.address;
          break;
        }
      }
      if (localIp !== 'localhost') break;
    }

    res.json({
      users: userCount,
      libraries: libraryCount,
      mediaItems: stats.totalCount,
      movies: stats.moviesCount,
      tvShows: stats.tvCount,
      storage: storageUsed,
      ramUsage: usedMemGB,
      ramTotal: totalMemGB,
      activeStreams: 0,
      systemHealth: 'Good',
      localIp,
      port: process.env.PORT || 3000,
      recentActivity: activityList
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Error fetching stats', error });
  }
};


export const getUsers = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const currentUserId = req.user.id;

    const users = await User.find({
      $or: [
        { _id: currentUserId },
        { managedBy: currentUserId }
      ]
    }, '-password -pin').sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, managed, pin, permissions } = req.body;

    // Check if user exists (only if email is provided)
    if (email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        // @ts-ignore
        return res.status(400).json({ message: 'User already exists' });
      }
    }

    const newUser = new User({
      name,
      email: email || undefined,
      password,
      managedBy: managed ? (req as any).user._id : undefined,
      pin: managed ? pin : undefined,
      role: 'viewer', // All new users created here should be viewers by default
      permissions: managed ? permissions : undefined
    });

    await newUser.save();

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        managedBy: newUser.managedBy
      }
    });
  } catch (error) {
    console.error('Create User Error:', error);
    res.status(500).json({ message: 'Error creating user', error });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // @ts-ignore
    const currentUserId = req.user.id;

    // Prevent self-deletion from the admin panel for safety
    if (id === currentUserId) {
      // @ts-ignore
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    const userToDelete = await User.findById(id);
    if (!userToDelete) {
      // @ts-ignore
      return res.status(404).json({ message: 'User not found' });
    }

    await User.findByIdAndDelete(id);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete User Error:', error);
    res.status(500).json({ message: 'Error deleting user', error });
  }
};
