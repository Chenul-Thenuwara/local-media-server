import { Request, Response } from 'express';
import Media from '../models/Media';
import Library from '../models/Library';

// Map library-style type names to media record type names
const toMediaType = (t: string) => {
  if (t === 'movies') return 'movie';
  return t; // 'tv', 'music' stay the same
};

// Get recent media (limit 20)
export const getRecentMedia = async (req: Request, res: Response): Promise<void> => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const { type } = req.query;

    let libQuery: any = { userId };
    if (process.env.DEVICE_ID) {
      libQuery.deviceId = process.env.DEVICE_ID;
    }

    const libraries = await Library.find(libQuery);
    const libraryIds = libraries.map(lib => lib._id);

    if (libraryIds.length === 0) {
      res.json([]);
      return;
    }

    // Filter by media's own type field
    const mediaQuery: any = { libraryId: { $in: libraryIds } };
    if (type) mediaQuery.type = toMediaType(String(type));

    const media = await Media.find(mediaQuery)
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

    // Find ALL user libraries (no type filter on library - auto libraries hold mixed content)
    let libQuery: any = { userId };
    if (process.env.DEVICE_ID) {
      libQuery.deviceId = process.env.DEVICE_ID;
    }

    const libraries = await Library.find(libQuery);
    let targetLibraryIds = libraries.map(lib => lib._id);

    // If specific library requested, ensure it belongs to user
    if (libraryId) {
      targetLibraryIds = targetLibraryIds.filter(id => id.toString() === libraryId.toString());
    }

    if (targetLibraryIds.length === 0) {
      res.json([]);
      return;
    }

    // Filter media by its OWN type field (not library type)
    const mediaQuery: any = { libraryId: { $in: targetLibraryIds } };
    if (type) mediaQuery.type = toMediaType(String(type));

    const media = await Media.find(mediaQuery)
      .sort({ title: 1 });

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
