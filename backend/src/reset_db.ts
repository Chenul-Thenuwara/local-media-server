import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Library from './models/Library';
import Media from './models/Media';
import User from './models/User';

dotenv.config();

const reset = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log('Connected to DB');

    await User.deleteMany({});
    await Library.deleteMany({});
    await Media.deleteMany({});

    console.log('Database cleared successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error clearing DB:', error);
    process.exit(1);
  }
};

reset();
