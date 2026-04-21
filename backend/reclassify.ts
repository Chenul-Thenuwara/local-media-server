// Migration script: Re-classify media using TMDB multi-search
// Run with: npx ts-node reclassify.ts
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

import mongoose from 'mongoose';
import axios from 'axios';
import path from 'path';

const MONGO_URI = 'mongodb+srv://chenul:Helsinki@lms-cluster.cwkzgk5.mongodb.net/?appName=lms-cluster';
const TMDB_API_KEY = '9c9d429b2205ac282101a044bf2e6a2c';

// Minimal schema
const MediaSchema = new mongoose.Schema({ filename: String, type: String, title: String, posterPath: String, backdropPath: String, overview: String, releaseDate: String, tmdbId: Number }, { strict: false });
const Media = mongoose.models.Media || mongoose.model('Media', MediaSchema);

function cleanFilename(filename: string): string {
  const name = path.parse(filename).name;
  return name
    .replace(/[.\-_]/g, ' ')
    .replace(/\b(S\d{1,2}E\d{1,2}|Season\s*\d+|\d+x\d+)\b.*/gi, '')
    .replace(/\s+(19|20)\d{2}.*$/, '')
    .replace(/(REPACK|PROPER|BluRay|WEB|HDTV|4K|2160p|1080p|720p|HDR|x264|x265|HEVC|UHD|REMUX).*/gi, '')
    .replace(/Pahe\.in|YTS|YIFY|RARBG|GalaxyRG/gi, '')
    .replace(/(\[.*?\]|\{.*?\}|\(.*?\))/g, '')
    .trim();
}

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const all = await Media.find({ type: { $in: ['movie', 'tv'] } });
  console.log(`Found ${all.length} video media items to check`);

  let fixed = 0;
  for (const media of all) {
    const clean = cleanFilename(media.filename);
    if (!clean || clean.length < 2) continue;

    try {
      const res = await axios.get(`https://api.themoviedb.org/3/search/multi`, {
        params: { api_key: TMDB_API_KEY, query: clean, language: 'en-US' }
      });

      const results = (res.data.results || []).filter((r: any) => r.media_type === 'movie' || r.media_type === 'tv');
      if (results.length === 0) continue;

      const match = results[0];
      const tmdbType: 'movie' | 'tv' = match.media_type;
      const isTV = tmdbType === 'tv';

      const update: any = {
        tmdbId: match.id,
        title: isTV ? match.name : match.title,
        posterPath: match.poster_path,
        backdropPath: match.backdrop_path,
        overview: match.overview,
        releaseDate: isTV ? match.first_air_date : match.release_date,
      };

      if (tmdbType !== media.type) {
        update.type = tmdbType;
        console.log(`✅ Re-classified: "${media.filename}" → ${media.type} → ${tmdbType}`);
        fixed++;
      } else {
        // Still update metadata even if type matches
        console.log(`  ✓ Confirmed ${media.type}: "${update.title || media.filename}"`);
      }

      await Media.findByIdAndUpdate(media._id, update);
      await new Promise(r => setTimeout(r, 150)); // Rate limit respect
    } catch (e: any) {
      console.error(`Error for ${media.filename}:`, e.message);
    }
  }

  console.log(`\n🎉 Done! Re-classified ${fixed} of ${all.length} items.`);
  await mongoose.disconnect();
}

run().catch(console.error);
