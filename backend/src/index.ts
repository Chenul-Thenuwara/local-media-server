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
    const { scanLibrary } = require('./services/scannerService');

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
    console.log(`Startup: Found ${libraries.length} libraries for device ${deviceId}. Starting scan...`);

    for (const lib of libraries) {
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
