import { Request, Response } from 'express';
import mongoose from 'mongoose';
import os from 'os';
import User from '../models/User';
import Library from '../models/Library';
import Media from '../models/Media';

export const getSystemStats = async (req: Request, res: Response) => {
  console.log('Admin Stats Request Received');
  try {
    console.log('Using DB:', mongoose.connection.db?.databaseName);

    const userCount = await User.countDocuments();
    console.log('User Count:', userCount);

    const libraryCount = await Library.countDocuments();
    console.log('Library Count:', libraryCount);

    // Fetch recent media (movies/tv)
    const recentMedia = await Media.find({}, 'title type createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    // Fetch libraries
    const libraries = await Library.find({}, 'name type');
    console.log('Libraries Found:', libraries.length);

    // Aggregate size and counts
    const mediaStats = await Media.aggregate([
      {
        $group: {
          _id: null,
          totalSize: { $sum: "$size" },
          totalCount: { $sum: 1 },
          moviesCount: {
            $sum: { $cond: [{ $eq: ["$type", "movie"] }, 1, 0] }
          },
          tvCount: {
            $sum: { $cond: [{ $eq: ["$type", "tv"] }, 1, 0] }
          }
        }
      }
    ]);

    console.log('Media Stats:', mediaStats);

    const stats = mediaStats[0] || { totalSize: 0, totalCount: 0, moviesCount: 0, tvCount: 0 };

    // Format size (bytes to GB)
    const storageUsed = (stats.totalSize / (1024 * 1024 * 1024)).toFixed(2) + " GB";

    // Combine recent activity
    const activityList = [
      ...recentMedia.map(m => ({
        id: m._id,
        title: `Added: ${m.title || m.filename}`,
        time: 'Just now',
        type: m.type
      })),
      ...libraries.map(lib => ({
        id: lib._id,
        title: `Library: ${lib.name}`,
        time: 'Active',
        type: 'library'
      }))
    ].slice(0, 10);

    // Calculate RAM Usage
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const usedMemGB = (usedMem / (1024 * 1024 * 1024)).toFixed(2);
    const totalMemGB = (totalMem / (1024 * 1024 * 1024)).toFixed(2);

    // Get Local IP
    const nets = os.networkInterfaces();
    let localIp = 'localhost';

    for (const name of Object.keys(nets)) {
      for (const net of nets[name] || []) {
        // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
        if (net.family === 'IPv4' && !net.internal) {
          localIp = net.address;
          break; // Take the first one
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
      localIp: localIp,
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
      role: managed ? 'viewer' : 'admin', // Default role logic
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
