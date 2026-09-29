
import mongoose from 'mongoose';
import User from './src/models/User';
import dotenv from 'dotenv';
import { google } from 'googleapis';

dotenv.config();

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI as string);
  const user = await User.findOne({ googleRefreshToken: { $exists: true } });

  if (!user || !user.googleRefreshToken) {
    console.log('No user with token.');
    await mongoose.disconnect();
    return;
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:5173/google-callback'
  );

  oauth2Client.setCredentials({ refresh_token: user.googleRefreshToken });
  const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });

  try {
    const res = await oauth2.userinfo.get();
    console.log('SUCCESS! Profile fetched.');
    console.log('Email:', res.data.email);
    console.log('Name:', res.data.name);
  } catch (err: any) {
    console.error('FAILED to fetch profile.');
    console.error(err.message);
  }

  await mongoose.disconnect();
};

run().catch(console.error);
