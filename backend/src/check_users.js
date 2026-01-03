const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { Schema } = mongoose;

dotenv.config();

// Define schemas loosely to read data
const UserSchema = new Schema({}, { strict: false });
const LibrarySchema = new Schema({}, { strict: false });
const MediaSchema = new Schema({}, { strict: false });

const User = mongoose.model('User', UserSchema);
const Library = mongoose.model('Library', LibrarySchema);
const Media = mongoose.model('Media', MediaSchema);

const check = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const users = await User.find({});
    console.log('\n--- USERS ---');
    users.forEach(u => {
      console.log(`ID: ${u._id}`);
      console.log(`Username: ${u.username}`);
      console.log(`Email: ${u.email}`);
      console.log('---');
    });

    const libraries = await Library.find({});
    console.log('\n--- LIBRARIES ---');
    libraries.forEach(l => {
      console.log(`ID: ${l._id}`);
      console.log(`Path: ${l.path}`);
      console.log(`Type: ${l.type}`);
      console.log(`OwnerUserID: ${l.userId}`); // This is what we need to match
      console.log('---');
    });

    const media = await Media.find({});
    const mediaConfig = {};
    media.forEach(m => {
      const lid = m.libraryId.toString();
      mediaConfig[lid] = (mediaConfig[lid] || 0) + 1;
    });

    console.log(`\nTotal Media Files: ${media.length}`);
    console.log('--- MEDIA DISTRIBUTION ---');
    for (const [libId, count] of Object.entries(mediaConfig)) {
      console.log(`Library ${libId} has ${count} files.`);
    }

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

check();
