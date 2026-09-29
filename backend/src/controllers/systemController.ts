import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

export const getDrives = async (req: Request, res: Response): Promise<void> => {
  if (process.platform !== 'win32') {
    // We are likely in Docker (Linux)
    // Return standard mount points
    const drives = [
      { name: 'Root (/)', path: '/' },
      { name: 'Media (Mounted)', path: '/media' }
    ];
    res.json(drives);
    return;
  }

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
    const rawPath = req.query.path as string;

    if (!rawPath) {
      res.status(400).json({ message: 'Path is required' });
      return;
    }

    const resolvedPath = path.resolve(rawPath);
    if (!fs.existsSync(resolvedPath)) {
      res.status(404).json({ message: 'Directory does not exist' });
      return;
    }

    const stat = await fs.promises.stat(resolvedPath);
    if (!stat.isDirectory()) {
      res.status(400).json({ message: 'Path is not a directory' });
      return;
    }

    const entries = await fs.promises.readdir(resolvedPath, { withFileTypes: true });

    const contents = entries
      .filter(entry => entry.isDirectory()) // Only show folders for selection
      .map(entry => ({
        name: entry.name,
        path: path.join(resolvedPath, entry.name).replace(/\\/g, '/'), // Windows path normalization
        type: 'folder'
      }));

    res.json(contents);
  } catch (error) {
    console.error('Error reading directory:', error);
    res.status(500).json({ message: 'Failed to read directory' });
  }
};
