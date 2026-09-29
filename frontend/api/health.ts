import { VercelRequest, VercelResponse } from '@vercel/node';
import mongoose from 'mongoose';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let dbStatus = 'disconnected';
  const mongoURI = process.env.MONGO_URI;

  if (mongoURI) {
    try {
      if (mongoose.connection.readyState === 0) {
        await mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 3000 });
      }
      dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'connecting';
    } catch (err: any) {
      dbStatus = `error: ${err.message || 'connection failed'}`;
    }
  } else {
    dbStatus = 'unconfigured (missing MONGO_URI)';
  }

  const isHealthy = dbStatus === 'connected' || !mongoURI;

  return res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'degraded',
    service: 'cineora-cloud-api',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbStatus,
    environment: process.env.NODE_ENV || 'production',
  });
}
