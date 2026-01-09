import { Request, Response } from 'express';
import Library from '../models/Library';
import { scanLibrary } from '../services/scannerService';

export const getLibraries = async (req: Request, res: Response): Promise<void> => {
  try {
    // @ts-ignore - user is attached by auth middleware
    const libraries = await Library.find({ userId: req.user.id });
    res.json(libraries);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching libraries' });
  }
};

export const createLibrary = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, path, type } = req.body;
    // @ts-ignore
    const userId = req.user.id;

    // Check for duplicates
    const existing = await Library.findOne({ userId, path });
    if (existing) {
      res.status(409).json({ message: 'Library with this path already exists' });
      return;
    }

    const newLibrary = new Library({
      name,
      path,
      type,
      userId
    });

    await newLibrary.save();

    // Trigger async scan (don't await response)
    scanLibrary((newLibrary._id as unknown) as string, path, type);

    res.status(201).json(newLibrary);
  } catch (error) {
    res.status(500).json({ message: 'Error creating library' });
  }
};

export const refreshLibrary = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    // @ts-ignore
    const userId = req.user.id;

    const library = await Library.findOne({ _id: id, userId });
    if (!library) {
      res.status(404).json({ message: 'Library not found' });
      return;
    }

    // Trigger scan
    scanLibrary((library._id as unknown) as string, library.path, library.type);

    res.json({ message: 'Scan started' });

  } catch (error) {
    res.status(500).json({ message: 'Error refreshing library' });
  }
};
