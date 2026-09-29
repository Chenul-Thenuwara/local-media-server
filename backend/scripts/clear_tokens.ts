
import mongoose from 'mongoose';
import User from './src/models/User';
import dotenv from 'dotenv';

dotenv.config();

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI as string);
  console.log('Connected to DB');

  await User.updateMany({}, { $unset: { googleRefreshToken: 1 } });
  console.log('Cleared all google refresh tokens.');

  await mongoose.disconnect();
};

run().catch(console.error);
