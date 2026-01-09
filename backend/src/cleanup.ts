
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Library from './models/Library';
import Media from './models/Media';
import connectDB from './db';

dotenv.config();

const cleanDuplicates = async () => {
  await connectDB();

  console.log('Cleaning duplicates...');

  const libraries = await Library.find({});
  const processedPaths = new Set();
  const duplicateLibraries = [];

  for (const lib of libraries) {
    // Normalize path (Windows)
    const normalizedPath = lib.path.toLowerCase().replace(/\\/g, '/');

    if (processedPaths.has(normalizedPath)) {
      duplicateLibraries.push(lib);
    } else {
      processedPaths.add(normalizedPath);
    }
  }

  console.log(`Found ${duplicateLibraries.length} duplicate libraries.`);

  for (const lib of duplicateLibraries) {
    console.log(`Removing Library: ${lib.name} (${lib.path})`);
    // Delete media associated with this library
    await Media.deleteMany({ libraryId: lib._id });
    // Delete the library itself
    await Library.findByIdAndDelete(lib._id);
  }

  // Also clean up duplicate media within valid libraries (just in case)
  // This is heavier, so we'll just stick to library-level dedup for now.
  // actually, let's just wipe all media for a fresh valid scan?
  // No, that's too destructive. The above logic handles the "same folder added twice" case.

  console.log('Cleanup complete.');
  process.exit();
};

cleanDuplicates();
