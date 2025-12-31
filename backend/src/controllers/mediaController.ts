import { Request, Response } from 'express';
import Media from '../models/Media';
import Library from '../models/Library';

export const getRecentMedia = async (req: Request, res: Response): Promise<void> => {
  try {
    // @ts-ignore
    const userId = req.user.id;

    // Find all libraries for this user
    const libraries = await Library.find({ userId });
    const libraryIds = libraries.map(lib => lib._id);

    // Find media belonging to those libraries, sorted by newest first
    const media = await Media.find({ libraryId: { $in: libraryIds } })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json(media);
  } catch (error) {
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
