import { Request, Response } from 'express';
import Library from '../models/Library';

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

    const newLibrary = new Library({
      name,
      path,
      type,
      userId
    });

    await newLibrary.save();
    res.status(201).json(newLibrary);
  } catch (error) {
    res.status(500).json({ message: 'Error creating library' });
  }
};
