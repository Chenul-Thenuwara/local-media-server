import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import cors from 'cors';

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
    const { scanLibrary } = require('./services/scannerService');
    const libraries = await Library.find({});
    console.log(`Startup: Found ${libraries.length} libraries. Starting scan...`);

    for (const lib of libraries) {
      scanLibrary(lib._id, lib.path, lib.type);
    }
  } catch (e) {
    console.error("Startup scan failed:", e);
  }
});

app.use(cors());
app.use(express.json());

app.use('/api', routes);
app.use('/api/tmdb', tmdbRoutes);

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
