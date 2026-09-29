import { Request, Response } from 'express';
import fs from 'fs';
import Media from '../models/Media';
import Library from '../models/Library';
import mime from 'mime-types';

export const streamMedia = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { range } = req.headers;
    // @ts-ignore
    const user = req.user;

    const media = await Media.findById(id);
    if (!media) {
      res.status(404).json({ message: 'Media not found' });
      return;
    }

    // Check authorization: user must have access to the library
    if (user && user.role !== 'admin') {
      const library = await Library.findById(media.libraryId);
      const userId = user.id || user._id;
      if (!library || library.userId.toString() !== userId.toString()) {
        res.status(403).json({ message: 'Not authorized to stream this media' });
        return;
      }
    }

    const videoPath = media.path;

    if (!fs.existsSync(videoPath)) {
      res.status(404).json({ message: 'File not found on server disk' });
      return;
    }

    const stat = fs.statSync(videoPath);
    const videoSize = stat.size;

    // Determine MIME type
    const contentType = (mime.lookup(videoPath) as string) || 'video/mp4';

    if (range) {
      // Parse Range Header: bytes=32324-
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : videoSize - 1;

      // Validate range
      if (isNaN(start) || start >= videoSize || end >= videoSize || start > end) {
        res.status(416).set('Content-Range', `bytes */${videoSize}`).end();
        return;
      }

      const chunksize = end - start + 1;
      const file = fs.createReadStream(videoPath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${videoSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType,
      };

      res.writeHead(206, head);
      file.pipe(res);

      req.on('close', () => {
        file.destroy();
      });
    } else {
      const head = {
        'Content-Length': videoSize,
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
      };
      res.writeHead(200, head);
      const file = fs.createReadStream(videoPath);
      file.pipe(res);

      req.on('close', () => {
        file.destroy();
      });
    }
  } catch (error) {
    console.error('Stream Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Error streaming media' });
    }
  }
};
