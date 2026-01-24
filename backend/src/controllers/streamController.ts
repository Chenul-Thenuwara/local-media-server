import { Request, Response } from 'express';
import fs from 'fs';
import Media from '../models/Media';
import mime from 'mime-types';
import ffmpeg from 'fluent-ffmpeg';

export const streamMedia = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { range } = req.headers;
    const transcode = req.query.transcode === 'true';

    const media = await Media.findById(id);
    if (!media) {
      res.status(404).json({ message: 'Media not found' });
      return;
    }

    const videoPath = media.path;

    if (transcode) {
      // Transcode Audio Only (Copy Video)
      // Converts to output format friendly for streaming (matroska is good for piping, but web needs mp4/webm. 
      // Fragmented MP4 (ismv) is good for browser streaming but complex.
      // WebM (VP9/Opus) is good but copying video (h264) into WebM is not standard.
      // Safest for compatibility: Matroska container with H264+AAC usually plays in Chrome, but maybe not Safari.
      // Actually, Safari likes MP4. Chrome likes WebM/MP4.
      // Let's try output format 'mp4' with movflags 'frag_keyframe+empty_moov' for streaming.

      const head = {
        'Content-Type': 'video/mp4',
      };
      res.writeHead(200, head);

      ffmpeg(videoPath)
        .videoCodec('copy')
        .audioCodec('aac')
        .audioChannels(2) // Downmix to stereo for safety
        .format('mp4')
        .outputOptions([
          '-movflags frag_keyframe+empty_moov',
          '-preset ultrafast'
        ])
        .on('error', (err) => {
          console.error('Transcoding error:', err);
          // Cannot send error JSON if headers sent
        })
        .pipe(res, { end: true });

      return;
    }

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
