import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import User from './src/models/User';

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const makeAdmin = async () => {
  try {
    let uri = process.env.MONGO_URI;
    console.log('Mongo URI found:', !!uri);

    if (!uri) {
      console.log('Using default URI: mongodb://localhost:27017/lms');
      uri = 'mongodb://localhost:27017/lms';
    }

    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    const user = await User.findOne({});
    console.log('User found:', user ? user.email : 'None');

    if (user) {
      user.role = 'admin';
      await user.save();
      console.log(`Successfully made user ${user.name} (${user.email}) an admin.`);
    } else {
      console.log('No users found.');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

makeAdmin();
