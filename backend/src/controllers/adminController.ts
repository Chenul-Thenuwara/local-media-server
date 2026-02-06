import { Request, Response } from 'express';
import mongoose from 'mongoose';
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

    res.json({
      users: userCount,
      libraries: libraryCount,
      mediaItems: stats.totalCount,
      movies: stats.moviesCount,
      tvShows: stats.tvCount,
      storage: storageUsed,
      activeStreams: 0,
      systemHealth: 'Good',
      recentActivity: activityList
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Error fetching stats', error });
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find({}, '-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error });
  }
};
