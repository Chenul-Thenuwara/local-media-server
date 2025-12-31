import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

export const getDrives = async (req: Request, res: Response): Promise<void> => {
  // Use PowerShell to list drives (more robust on modern Windows)
  exec('powershell -Command "Get-PSDrive -PSProvider FileSystem | Select-Object -ExpandProperty Name"', (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return res.status(500).json({ message: 'Failed to list drives' });
    }

    // Output is just drive letters: C \n D \n ...
    const lines = stdout.split('\r\n').filter(line => line.trim() !== '');
    const drives = lines.map(line => ({
      name: line.trim() + ':',
      path: line.trim() + ':/'
    }));

    res.json(drives);
  });
};

export const getDirectories = async (req: Request, res: Response): Promise<void> => {
  try {
    const dirPath = req.query.path as string;

    if (!dirPath) {
      res.status(400).json({ message: 'Path is required' });
      return;
    }

    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });

    const contents = entries
      .filter(entry => entry.isDirectory()) // Only show folders for selection
      .map(entry => ({
        name: entry.name,
        path: path.join(dirPath, entry.name).replace(/\\/g, '/'), // Windows path normalization
        type: 'folder'
      }));

    res.json(contents);
  } catch (error) {
    console.error('Error reading directory:', error);
    res.status(500).json({ message: 'Failed to read directory' });
  }
};
