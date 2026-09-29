
import mongoose from 'mongoose';
import User from './src/models/User';
import dotenv from 'dotenv';

dotenv.config();

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI as string);
  console.log('Connected to DB');

  const users = await User.find({});
  console.log(`Found ${users.length} users.`);
  users.forEach(u => {
    console.log(`User: ${u.email} (${u._id})`);
    console.log(`  - Role: ${u.role}`);
    console.log(`  - Managed By: ${u.managedBy}`);
    // console.log(`  - Has Refresh Token: ${!!u.googleRefreshToken}`);
  });

  await mongoose.disconnect();
};

run().catch(console.error);
