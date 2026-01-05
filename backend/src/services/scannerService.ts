import fs from 'fs';
import path from 'path';
import Media from '../models/Media';
import { fetchMetadata } from './tmdbService';

import ffmpeg from 'fluent-ffmpeg';
// @ts-ignore
import ffprobeStatic from 'ffprobe-static';

// Set ffprobe path
ffmpeg.setFfprobePath(ffprobeStatic.path);

const VIDEO_EXTENSIONS = ['.mp4', '.mkv', '.avi', '.mov', '.webm'];

// Helper to extract technical metadata
const getMediaInfo = (filePath: string): Promise<any> => {
  return new Promise((resolve) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        console.error(`Error probing ${filePath}:`, err);
        return resolve(null);
      }

      const videoStream = metadata.streams.find(s => s.codec_type === 'video');
      const audioStream = metadata.streams.find(s => s.codec_type === 'audio');

      if (!videoStream) return resolve(null);

      // Determine Resolution
      let resolution = 'SD';
      const height = videoStream.height || 0;
      const width = videoStream.width || 0;

      if (width >= 3800 || height >= 2100) resolution = '4K';
      else if (width >= 1900 || height >= 1000) resolution = '1080p';
      else if (width >= 1200 || height >= 700) resolution = '720p';

      // Determine HDR
      // Common HDR transfers: smpte2084 (PQ), arib-std-b67 (HLG)
      const isHdr = ['smpte2084', 'arib-std-b67'].includes(videoStream.color_transfer || '') ||
        (videoStream.color_space === 'bt2020nc');

      resolve({
        resolution,
        videoCodec: videoStream.codec_name?.toUpperCase(),
        audioCodec: audioStream?.codec_name?.toUpperCase(),
        audioChannels: audioStream?.channels,
        isHdr
      });
    });
  });
};

export const scanLibrary = async (libraryId: string, folderPath: string, type: 'movies' | 'tv') => {
  console.log(`Scanning ${folderPath} for ${type}...`);

  try {
    if (!fs.existsSync(folderPath)) {
      console.error(`Path does not exist: ${folderPath}`);
      return;
    }

    const files = await getFiles(folderPath);

    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if (VIDEO_EXTENSIONS.includes(ext)) {
        const filename = path.basename(file);

        // Check if exists
        const exists = await Media.findOne({ path: file, libraryId });

        // Always scan for tech details if we are updating or creating
        const mediaInfo = await getMediaInfo(file);
        console.log(`[Scanner] Probed ${filename}:`, mediaInfo ? 'Success' : 'Failed');

        if (!exists) {
          // ... (create logic)
        }
        else {
          // Check if we need to backfill mediaInfo or TMDB
          let update: any = {};

          // Force update for debugging if mediaInfo is found
          if (mediaInfo) {
            console.log(`[Scanner] update candidate for ${filename}. Existing mediaInfo:`, !!exists.mediaInfo);
            // Logic to update if missing OR if we just want to ensure it's there (we can improve this check later)
            if (!exists.mediaInfo || !exists.mediaInfo.resolution) {
              update.mediaInfo = mediaInfo;
            }
          }

          if (!exists.tmdbId) {
            const mediaType = type === 'movies' ? 'movie' : 'tv';
            const metadata = await fetchMetadata(filename, mediaType);
            if (metadata) update = { ...update, ...metadata };
          }

          if (Object.keys(update).length > 0) {
            await Media.findByIdAndUpdate(exists._id, update);
            console.log(`[Scanner] Updated Data for: ${filename}`, update.mediaInfo);
          } else {
            console.log(`[Scanner] No updates needed for ${filename}`);
          }
        }
      }
    }
    console.log(`Scan complete for ${folderPath}`);
  } catch (err) {
    console.error('Error scanning library:', err);
  }
};

async function getFiles(dir: string): Promise<string[]> {
  const dirents = await fs.promises.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(dirents.map((dirent) => {
    const res = path.resolve(dir, dirent.name);
    return dirent.isDirectory() ? getFiles(res) : res;
  }));
  return Array.prototype.concat(...files);
}
