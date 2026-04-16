
import mongoose from 'mongoose';
import User from './src/models/User';
import dotenv from 'dotenv';
import { google } from 'googleapis';

dotenv.config();

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI as string);
  console.log('Connected to DB');

  const user = await User.findOne({ googleRefreshToken: { $exists: true } });

  if (!user || !user.googleRefreshToken) {
    console.log('No user with token found.');
    await mongoose.disconnect();
    return;
  }

  console.log('Found user:', user.email);
  console.log('Refresh Token:', user.googleRefreshToken.substring(0, 10) + '...');

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:5173/google-callback' // Use the one we think is correct
  );

  oauth2Client.setCredentials({ refresh_token: user.googleRefreshToken });

  try {
    console.log('Attempting to list albums...');
    const url = 'https://photoslibrary.googleapis.com/v1/albums?pageSize=1';
    const res = await oauth2Client.request({ url });
    console.log('SUCCESS! Albums fetched:', (res.data as any).albums ? 'Yes' : 'No');
  } catch (err: any) {
    console.error('FAILED to list albums.');
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Data:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.error(err);
    }
  }

  await mongoose.disconnect();
};

run().catch(console.error);
