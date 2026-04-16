import { Request, Response } from 'express';
import Media from '../models/Media';
import Library from '../models/Library';

// Get recent media (limit 20)
// Get recent media (limit 20)
export const getRecentMedia = async (req: Request, res: Response): Promise<void> => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const { type } = req.query;

    let libQuery: any = { userId };
    if (type) {
      libQuery.type = type;
    }
    if (process.env.DEVICE_ID) {
      libQuery.deviceId = process.env.DEVICE_ID;
    }

    const libraries = await Library.find(libQuery);
    const libraryIds = libraries.map(lib => lib._id);

    if (libraryIds.length === 0) {
      res.json([]);
      return;
    }

    const media = await Media.find({ libraryId: { $in: libraryIds } })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json(media);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching media' });
  }
};

// Get all media with filters
export const getAllMedia = async (req: Request, res: Response): Promise<void> => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const { type, libraryId } = req.query;

    console.log('getAllMedia called:', { userId, type, libraryId });

    let query: any = { userId }; // Assuming we might scope by user differently later, but for now rely on library ownership

    // 1. Find User's Libraries
    // If type is specified, filter libraries by type first
    let libQuery: any = { userId };
    if (type) {
      libQuery.type = type;
    }
    if (process.env.DEVICE_ID) {
      libQuery.deviceId = process.env.DEVICE_ID;
    }

    const libraries = await Library.find(libQuery);
    console.log('Libraries found:', libraries.length);
    let targetLibraryIds = libraries.map(lib => lib._id);

    // If specific library requested, ensure it belongs to user
    if (libraryId) {
      targetLibraryIds = targetLibraryIds.filter(id => id.toString() === libraryId.toString());
    }

    // 2. Fetch Media
    // If no libraries match queries, return empty
    if (targetLibraryIds.length === 0) {
      console.log('No matching libraries found.');
      res.json([]);
      return;
    }

    const media = await Media.find({ libraryId: { $in: targetLibraryIds } })
      .sort({ title: 1 }); // Alphabetical sort for library view

    console.log('Media found:', media.length);

    res.json(media);
  } catch (error) {
    console.error('getAllMedia Error:', error);
    res.status(500).json({ message: 'Error fetching media' });
  }
};

export const getMediaById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    // @ts-ignore
    const userId = req.user.id;

    // Find media and populate library to check ownership
    const media = await Media.findById(id).populate('libraryId');

    if (!media) {
      res.status(404).json({ message: 'Media not found' });
      return;
    }

    // Check ownership
    const library = media.libraryId as any;
    if (library.userId.toString() !== userId) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    res.json(media);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching media details' });
  }
};
