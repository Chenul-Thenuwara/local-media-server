import { Request, Response } from 'express';
import fs from 'fs';
import Media from '../models/Media';
import mime from 'mime-types';

export const streamMedia = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { range } = req.headers;

    // console.log(`Stream Request: ${id}, Range: ${range}`);

    const media = await Media.findById(id);
    if (!media) {
      res.status(404).json({ message: 'Media not found' });
      return;
    }

    const videoPath = media.path;

    const videoSize = fs.statSync(videoPath).size;

    // Determine MIME type
    const contentType = mime.lookup(videoPath) || 'video/mp4';

    if (range) {
      // Parse Range Header: bytes=32324-
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : videoSize - 1;

      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(videoPath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${videoSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType,
      };

      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': videoSize,
        'Content-Type': contentType,
      };
      res.writeHead(200, head);
      fs.createReadStream(videoPath).pipe(res);
    }
  } catch (error) {
    console.error('Stream Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Error streaming media' });
    }
  }
};
