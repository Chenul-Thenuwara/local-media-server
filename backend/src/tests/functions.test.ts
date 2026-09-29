import request from 'supertest';
import express from 'express';
import { cleanFilename } from '../services/tmdbService';
import { getDirectories, getDrives } from '../controllers/systemController';
import { streamMedia } from '../controllers/streamController';
import { protect, admin } from '../middleware/authMiddleware';
import User from '../models/User';
import Media from '../models/Media';
import jwt from 'jsonwebtoken';

describe('TMDB Filename Cleaning Function', () => {
  it('should clean resolution, release group, and quality tags', () => {
    const raw = 'Oppenheimer.2023.2160p.UHD.HDR.DDP5.1.Atmos.x265-GalaxyRG.mkv';
    const cleaned = cleanFilename(raw);
    expect(cleaned).toBe('Oppenheimer');
  });

  it('should extract show title and strip season/episode codes', () => {
    const raw = 'Breaking.Bad.S05E14.Ozymandias.1080p.BluRay.x264.mkv';
    const cleaned = cleanFilename(raw);
    expect(cleaned).toBe('Breaking Bad');
  });

  it('should preserve titles that are release years like 1917 or 2012', () => {
    expect(cleanFilename('1917.2019.1080p.BluRay.mkv')).toBe('1917');
    expect(cleanFilename('2012.2009.1080p.BluRay.mkv')).toBe('2012');
  });

  it('should strip trailing years from titles with multiple words', () => {
    expect(cleanFilename('Interstellar 2014 1080p.mp4')).toBe('Interstellar');
  });
});

describe('System Directory & Drive Inspection Functions', () => {
  const app = express();
  app.get('/api/system/browse', getDirectories);
  app.get('/api/system/drives', getDrives);

  it('should return 400 when path parameter is missing', async () => {
    const res = await request(app).get('/api/system/browse');
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Path is required/i);
  });

  it('should return 404 when requested directory does not exist', async () => {
    const res = await request(app).get('/api/system/browse?path=Z:/definitely/nonexistent/directory/12345');
    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/Directory does not exist/i);
  });

  it('should return system drives list', async () => {
    const res = await request(app).get('/api/system/drives');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (res.body.length > 0) {
      expect(res.body[0]).toHaveProperty('name');
      expect(res.body[0]).toHaveProperty('path');
    }
  });
});

describe('Auth Middleware Security Functions', () => {
  const app = express();
  app.get('/api/protected', protect, (req, res) => res.json({ success: true, user: (req as any).user }));
  app.get('/api/admin-only', protect, admin, (req, res) => res.json({ admin: true }));

  const secret = process.env.JWT_SECRET || 'dev_jwt_secret_change_in_production';

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('should reject requests without authorization token with 401', async () => {
    const res = await request(app).get('/api/protected');
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/no token/i);
  });

  it('should reject requests with invalid token with 401', async () => {
    const res = await request(app)
      .get('/api/protected')
      .set('Authorization', 'Bearer invalid_garbage_token_123');
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/token/i);
  });

  it('should allow valid token through to protected route', async () => {
    jest.spyOn(User, 'findById').mockReturnValue({
      select: jest.fn().mockResolvedValue({ _id: '60c72b2f9b1d8b2bad000001', role: 'viewer', name: 'Viewer User' })
    } as any);

    const validToken = jwt.sign({ id: '60c72b2f9b1d8b2bad000001' }, secret);
    const res = await request(app)
      .get('/api/protected')
      .set('Authorization', `Bearer ${validToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should reject non-admin users from admin-only routes with 403', async () => {
    jest.spyOn(User, 'findById').mockReturnValue({
      select: jest.fn().mockResolvedValue({ _id: '60c72b2f9b1d8b2bad000002', role: 'viewer', name: 'Viewer User' })
    } as any);

    const viewerToken = jwt.sign({ id: '60c72b2f9b1d8b2bad000002' }, secret);
    const res = await request(app)
      .get('/api/admin-only')
      .set('Authorization', `Bearer ${viewerToken}`);
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/admin/i);
  });

  it('should allow admin users through to admin-only routes', async () => {
    jest.spyOn(User, 'findById').mockReturnValue({
      select: jest.fn().mockResolvedValue({ _id: '60c72b2f9b1d8b2bad000003', role: 'admin', name: 'Admin User' })
    } as any);

    const adminToken = jwt.sign({ id: '60c72b2f9b1d8b2bad000003' }, secret);
    const res = await request(app)
      .get('/api/admin-only')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.admin).toBe(true);
  });
});

describe('Media Streaming Error Handling Function', () => {
  const app = express();
  app.get('/api/stream/:id', streamMedia);

  it('should return 404 when requested media does not exist in DB', async () => {
    jest.spyOn(Media, 'findById').mockResolvedValue(null);

    const res = await request(app).get('/api/stream/507f1f77bcf86cd799439011');
    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/Media not found/i);
  });
});
