import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import User from './src/models/User';
import Media from './src/models/Media';
import Library from './src/models/Library';

dotenv.config({ path: path.join(__dirname, '../.env') });

const debugStats = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/local-media-server';
    console.log('Connecting to:', uri);
    await mongoose.connect(uri);
    console.log('Connected.');

    const userCount = await User.countDocuments();
    const mediaCount = await Media.countDocuments();
    const libraryCount = await Library.countDocuments();
    const mediaTypes = await Media.aggregate([
      { $group: { _id: "$type", count: { $sum: 1 } } }
    ]);
    const users = await User.find({}, 'email role');

    console.log('--- DB STATS ---');
    console.log('Users:', userCount);
    users.forEach(u => console.log(` - ${u.email} (${u.role})`));
    console.log('Libraries:', libraryCount);
    console.log('Media Items:', mediaCount);
    console.log('Media Breakdown:', mediaTypes);
    console.log('----------------');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

debugStats();
