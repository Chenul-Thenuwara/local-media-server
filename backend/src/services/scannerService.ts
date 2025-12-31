import fs from 'fs';
import path from 'path';
import Media from '../models/Media';
import { fetchMetadata } from './tmdbService';

const VIDEO_EXTENSIONS = ['.mp4', '.mkv', '.avi', '.mov', '.webm'];

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

        if (!exists) {
          const stats = fs.statSync(file);
          const mediaType = type === 'movies' ? 'movie' : 'tv';

          // Try to fetch metadata
          const metadata = await fetchMetadata(filename, mediaType);

          await Media.create({
            filename,
            path: file,
            libraryId,
            type: mediaType,
            size: stats.size,
            ...metadata
          });
          console.log(`Indexed: ${filename} (TMDB: ${metadata ? 'Found' : 'Not Found'})`);
        }
        else if (!exists.tmdbId) {
          // Exists but missing metadata (Backfill)
          const mediaType = type === 'movies' ? 'movie' : 'tv';
          const metadata = await fetchMetadata(filename, mediaType);

          if (metadata) {
            await Media.findByIdAndUpdate(exists._id, { ...metadata });
            console.log(`Updated Metadata: ${filename}`);
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
