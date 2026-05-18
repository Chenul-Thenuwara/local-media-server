import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';

import connectDB from './db';

import routes from './routes';
import tmdbRoutes from './routes/tmdb';


const app = express();
const port = process.env.PORT || 3000;

// Connect to Database
connectDB().then(async () => {
  // Configured Startup Scan
  try {
    const Library = require('./models/Library').default;
    const Device = require('./models/Device').default;
    const User = require('./models/User').default;
    const { scanLibrary } = require('./services/scannerService');

    // Automatically drop problematic email_1 index if it exists
    try {
      await User.collection.dropIndex('email_1');
      console.log('[DB Fix] Dropped legacy email_1 unique index');
    } catch (err: any) {
      if (err.codeName !== 'IndexNotFound') {
        console.log('[DB Fix] Note: email_1 index not dropped (might not exist)');
      }
    }

    const deviceId = process.env.DEVICE_ID || 'ANY';
    const tunnelUrl = process.env.TUNNEL_URL || '';

    if (deviceId !== 'ANY' && tunnelUrl) {
      await Device.findOneAndUpdate(
        { deviceId },
        { tunnelUrl, lastSeen: new Date() },
        { upsert: true, new: true }
      );
      console.log(`[Discovery] Registered Device ${deviceId} at ${tunnelUrl}`);
    }

    const deviceQuery = process.env.DEVICE_ID ? { deviceId } : {};
    const libraries = await Library.find(deviceQuery);

    // Deduplicate by path — keep the newest library per unique path
    const uniqueLibraries = Object.values(
      libraries.reduce((acc: Record<string, any>, lib: any) => {
        const key = lib.path;
        if (!acc[key] || lib.createdAt > acc[key].createdAt) acc[key] = lib;
        return acc;
      }, {})
    );

    console.log(`Startup: Found ${libraries.length} libraries (${uniqueLibraries.length} unique paths) for device ${deviceId}. Starting scan...`);

    for (const lib of uniqueLibraries as any[]) {
      scanLibrary(lib._id, lib.path, lib.type);
    }
  } catch (e) {
    console.error("Startup scan failed:", e);
  }
});

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} from ${req.headers.origin || 'unknown origin'}`);
  next();
});

app.use('/api', routes);
app.use('/api/tmdb', tmdbRoutes);

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.use(express.static(path.join(__dirname, '../../frontend/dist')));
app.use((req: Request, res: Response, next) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/media/')) return next();
  res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
});

app.listen(port, () => {
  console.log(`Server is running at http://0.0.0.0:${port}`);
});
