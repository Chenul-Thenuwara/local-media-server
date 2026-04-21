import fs from 'fs';
import path from 'path';
import Media from '../models/Media';
import { fetchMetadata } from './tmdbService';
import { searchTrack, searchArtist } from './spotifyService';

import ffmpeg from 'fluent-ffmpeg';
// @ts-ignore
import ffprobeStatic from 'ffprobe-static';

ffmpeg.setFfprobePath(ffprobeStatic.path);

const VIDEO_EXTENSIONS = new Set(['.mp4', '.mkv', '.avi', '.mov', '.webm', '.m4v', '.flv']);
const MUSIC_EXTENSIONS = new Set(['.mp3', '.flac', '.aac', '.m4a', '.ogg', '.wav', '.wma', '.opus']);

// Detect media type purely by file extension
function detectMediaType(filename: string): 'video' | 'music' | null {
  const ext = path.extname(filename).toLowerCase();
  if (VIDEO_EXTENSIONS.has(ext)) return 'video';
  if (MUSIC_EXTENSIONS.has(ext)) return 'music';
  return null;
}

// Detect if a video file is likely a TV Show based on naming patterns like S01E02 or 1x02
function detectVideoSubType(filename: string): 'movie' | 'tv' {
  const tvPattern = /[Ss]\d{1,2}[Ee]\d{1,2}|season\s*\d+|\d+x\d+/i;
  return tvPattern.test(filename) ? 'tv' : 'movie';
}

// Parse basic music tags from filename (before Spotify enrichment)
function parseMusicTitle(filename: string): { title: string; artist?: string } {
  const base = path.basename(filename, path.extname(filename));
  // Common formats: "Artist - Title" or "01. Artist - Title"
  const dashMatch = base.replace(/^\d+[\.\)]\s*/, '').match(/^(.+?)\s[-–]\s(.+)$/);
  if (dashMatch) {
    return { artist: dashMatch[1].trim(), title: dashMatch[2].trim() };
  }
  return { title: base };
}

const getMediaInfo = (filePath: string): Promise<any> => {
  return new Promise((resolve) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return resolve(null);

      const videoStream = metadata.streams.find(s => s.codec_type === 'video');
      const audioStream = metadata.streams.find(s => s.codec_type === 'audio');

      if (!videoStream) return resolve(null);

      let resolution = 'SD';
      const height = videoStream.height || 0;
      const width = videoStream.width || 0;
      if (width >= 3800 || height >= 2100) resolution = '4K';
      else if (width >= 1900 || height >= 1000) resolution = '1080p';
      else if (width >= 1200 || height >= 700) resolution = '720p';

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

export const scanLibrary = async (libraryId: string, folderPath: string, type: string) => {
  console.log(`[Scanner] Scanning ${folderPath} (mode: ${type})...`);

  try {
    if (!fs.existsSync(folderPath)) {
      console.error(`[Scanner] Path does not exist: ${folderPath}`);
      return;
    }

    const files = await getFiles(folderPath);

    for (const file of files) {
      const filename = path.basename(file);
      const detectedKind = detectMediaType(filename);
      if (!detectedKind) continue; // Skip unknown extensions

      const exists = await Media.findOne({ path: file, libraryId });

      // ─── Handle MUSIC files ────────────────────────────────────────────
      if (detectedKind === 'music') {
        if (exists) {
          // Backfill Spotify data if missing
          if (!exists.spotifyTrackId) {
            const parsed = parseMusicTitle(filename);
            const spotify = await searchTrack(parsed.title, parsed.artist);
            if (spotify) {
              await Media.findByIdAndUpdate(exists._id, {
                spotifyTrackId: spotify.spotifyTrackId,
                spotifyAlbumArt: spotify.spotifyAlbumArt,
                durationMs: spotify.durationMs,
                releaseDate: spotify.releaseDate,
                genres: spotify.genres,
              });
              console.log(`[Scanner] Spotify enriched music: ${filename}`);
            }
          }
          continue;
        }

        const stat = await fs.promises.stat(file);
        const parsed = parseMusicTitle(filename);

        // Try Spotify enrichment
        const spotify = await searchTrack(parsed.title, parsed.artist);
        let artistImage: string | undefined;
        if (parsed.artist) {
          const artistData = await searchArtist(parsed.artist);
          artistImage = artistData?.image || undefined;
        }

        const newMedia = new Media({
          libraryId,
          type: 'music',
          path: file,
          filename,
          size: stat.size,
          title: parsed.title,
          artist: parsed.artist || (spotify ? undefined : undefined),
          album: spotify?.album,
          spotifyTrackId: spotify?.spotifyTrackId,
          spotifyAlbumArt: spotify?.spotifyAlbumArt || artistImage,
          durationMs: spotify?.durationMs,
          releaseDate: spotify?.releaseDate,
          genres: spotify?.genres,
        });

        await newMedia.save();
        console.log(`[Scanner] Added music: ${filename}`);
        continue;
      }

      // ─── Handle VIDEO files ────────────────────────────────────────────
      // Use filename pattern as initial hint, TMDB decides the real type
      const filenameHint = detectVideoSubType(filename);
      const mediaInfo = await getMediaInfo(file);

      if (!exists) {
        // Always fetch metadata — TMDB will tell us if it's a movie or TV show
        const metadata = await fetchMetadata(filename, filenameHint);
        // Trust TMDB's detected type over filename pattern
        const mediaType: 'movie' | 'tv' = metadata?.detectedType || filenameHint;
        const stat = await fs.promises.stat(file);

        const newMedia = new Media({
          libraryId,
          title: metadata?.title || filename,
          type: mediaType,
          path: file,
          filename,
          size: stat.size,
          tmdbId: metadata?.tmdbId,
          posterPath: metadata?.posterPath,
          backdropPath: metadata?.backdropPath,
          overview: metadata?.overview,
          releaseDate: metadata?.releaseDate,
          mediaInfo
        });

        await newMedia.save();
        console.log(`[Scanner] Added ${mediaType}: ${filename}`);
      } else {
        let update: any = {};

        // Re-classify using TMDB if we don't have it yet, or force for music files that slipped in
        if (!exists.tmdbId || exists.type === 'music') {
          const metadata = await fetchMetadata(filename, filenameHint);
          if (metadata) {
            update = { ...update, ...metadata };
            // Use TMDB's detected type if different from stored
            if (metadata.detectedType && metadata.detectedType !== exists.type) {
              update.type = metadata.detectedType;
              console.log(`[Scanner] Re-classified ${filename}: ${exists.type} → ${metadata.detectedType}`);
            }
            // Remove tmdbId from update object (it's in metadata directly)
            update.tmdbId = metadata.tmdbId;
          }
        }

        if (mediaInfo && (!exists.mediaInfo || !exists.mediaInfo.resolution)) {
          update.mediaInfo = mediaInfo;
        }

        if (Object.keys(update).length > 0) {
          await Media.findByIdAndUpdate(exists._id, update);
          console.log(`[Scanner] Updated: ${filename}`);
        }
      }}
    }

    console.log(`[Scanner] Scan complete for ${folderPath}`);
  } catch (err) {
    console.error('[Scanner] Error:', err);
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
