import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import routes from '../routes';
import User from '../models/User';
import Device from '../models/Device';
import Media from '../models/Media';
import Library from '../models/Library';
import History from '../models/History';

describe('Comprehensive End-to-End QA Test Suite', () => {
  let app: express.Application;
  const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_in_production';

  const createMockUser = (role: 'admin' | 'viewer' = 'admin') => {
    const id = role === 'admin' ? '507f1f77bcf86cd799439011' : '507f1f77bcf86cd799439022';
    const user: any = {
      _id: id,
      id: id,
      name: role === 'admin' ? 'Admin User' : 'Viewer User',
      email: `${role}@example.com`,
      role,
      watchlist: [] as any[],
      comparePassword: jest.fn().mockResolvedValue(true),
      comparePin: jest.fn().mockResolvedValue(true),
      save: jest.fn().mockResolvedValue(true),
    };
    user.select = jest.fn().mockResolvedValue(user);
    return user;
  };

  let mockAdminUser = createMockUser('admin');
  let mockViewerUser = createMockUser('viewer');

  const adminToken = jwt.sign({ id: mockAdminUser.id }, JWT_SECRET, { expiresIn: '1h' });
  const viewerToken = jwt.sign({ id: mockViewerUser.id }, JWT_SECRET, { expiresIn: '1h' });

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api', routes);
  });

  beforeEach(() => {
    mockAdminUser = createMockUser('admin');
    mockViewerUser = createMockUser('viewer');

    // Default mock for User.findById that works with both .select() chaining and direct await
    jest.spyOn(User, 'findById').mockImplementation((id: any) => {
      const target = id === mockViewerUser.id ? mockViewerUser : mockAdminUser;
      return {
        select: jest.fn().mockResolvedValue(target),
        populate: jest.fn().mockResolvedValue(target),
        then: (resolve: any) => Promise.resolve(target).then(resolve),
      } as any;
    });

    // Default mock for Device.findOne
    jest.spyOn(Device, 'findOne').mockReturnValue({
      sort: jest.fn().mockResolvedValue({ tunnelUrl: 'https://test.tunnel.local' }),
      then: (resolve: any) => Promise.resolve({ tunnelUrl: 'https://test.tunnel.local' }).then(resolve),
    } as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('1. Authentication & Registration QA', () => {
    it('QA-AUTH-01: Rejects duplicate user registration (400)', async () => {
      jest.spyOn(User, 'findOne').mockResolvedValue(mockAdminUser as any);

      const res = await request(app).post('/api/auth/register').send({
        name: 'Duplicate Admin',
        email: 'admin@example.com',
        password: 'Password123!',
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/already exists/i);
    });

    it('QA-AUTH-02: Registers a new user successfully and assigns admin to first user (201)', async () => {
      jest.spyOn(User, 'findOne').mockResolvedValue(null as any);
      jest.spyOn(User, 'countDocuments').mockResolvedValue(0);
      jest.spyOn(User.prototype, 'save').mockImplementation(function (this: any) {
        this._id = mockAdminUser._id;
        this.id = mockAdminUser.id;
        return Promise.resolve(this);
      });

      const res = await request(app).post('/api/auth/register').send({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'Password123!',
      });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.email).toBe('admin@example.com');
      expect(res.body.role).toBe('admin');
    });

    it('QA-AUTH-03: Rejects login with non-existent user email (400)', async () => {
      jest.spyOn(User, 'findOne').mockResolvedValue(null as any);

      const res = await request(app).post('/api/auth/login').send({
        email: 'unknown@example.com',
        password: 'Password123!',
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Invalid Credentials/i);
    });

    it('QA-AUTH-04: Rejects login with incorrect password (400)', async () => {
      const userWithFailedCompare = {
        ...mockAdminUser,
        comparePassword: jest.fn().mockResolvedValue(false),
      };
      jest.spyOn(User, 'findOne').mockResolvedValue(userWithFailedCompare as any);

      const res = await request(app).post('/api/auth/login').send({
        email: 'admin@example.com',
        password: 'WrongPassword',
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Invalid Credentials/i);
    });

    it('QA-AUTH-05: Authenticates valid login, fetches device tunnel, and returns token (200)', async () => {
      jest.spyOn(User, 'findOne').mockResolvedValue(mockAdminUser as any);

      const res = await request(app).post('/api/auth/login').send({
        email: 'admin@example.com',
        password: 'Password123!',
      });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.name).toBe('Admin User');
      expect(res.body.tunnelUrl).toBe('https://test.tunnel.local');
    });
  });

  describe('2. Authorization, Security & RBAC Middleware QA', () => {
    it('QA-SEC-01: Blocks unauthorized request without token to protected routes (401)', async () => {
      const res = await request(app).get('/api/media');
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/Not authorized/i);
    });

    it('QA-SEC-02: Blocks requests with invalid or tampered token (401)', async () => {
      const res = await request(app)
        .get('/api/media')
        .set('Authorization', 'Bearer invalid.token.payload');
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/Not authorized/i);
    });

    it('QA-SEC-03: Blocks viewer user from accessing admin endpoints (403)', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${viewerToken}`);
      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/Not authorized as an admin/i);
    });
  });

  describe('3. Media Operations & Search QA', () => {
    it('QA-MEDIA-01: Handles media listing when user has no libraries (200 empty list)', async () => {
      jest.spyOn(Library, 'find').mockResolvedValue([]);

      const res = await request(app)
        .get('/api/media')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('QA-MEDIA-02: Returns 404 when requesting non-existent media by ID', async () => {
      jest.spyOn(Media, 'findById').mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      } as any);

      const res = await request(app)
        .get('/api/media/507f1f77bcf86cd799439099')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/Media not found/i);
    });

    it('QA-SEARCH-01: Safely searches media without regex crash for special characters', async () => {
      jest.spyOn(Library, 'find').mockResolvedValue([{ _id: 'lib123' }] as any);
      jest.spyOn(Media, 'find').mockReturnValue({
        limit: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue([
            { _id: 'm1', title: 'Special [Movie] (2024)', tmdbId: 101 },
          ]),
        }),
      } as any);

      const res = await request(app)
        .get('/api/search?q=[Movie](')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
    });
  });

  describe('4. Watchlist & History QA', () => {
    it('QA-WL-01: Validates required title and mediaType when adding to watchlist (400)', async () => {
      const res = await request(app)
        .post('/api/watchlist')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ mediaId: 'm123' }); // missing title and mediaType

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Title and MediaType are required/i);
    });

    it('QA-WL-02: Adds item to watchlist successfully (200)', async () => {
      const res = await request(app)
        .post('/api/watchlist')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          mediaId: 'm123',
          tmdbId: 550,
          mediaType: 'movie',
          title: 'Fight Club',
        });

      expect(res.status).toBe(200);
      expect(mockAdminUser.watchlist.length).toBe(1);
      expect(mockAdminUser.watchlist[0].title).toBe('Fight Club');
    });

    it('QA-WL-03: Rejects duplicate item in watchlist (400)', async () => {
      mockAdminUser.watchlist = [{ tmdbId: 550, mediaType: 'movie', title: 'Fight Club' }];

      const res = await request(app)
        .post('/api/watchlist')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tmdbId: 550,
          mediaType: 'movie',
          title: 'Fight Club',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/already in watchlist/i);
    });

    it('QA-HIST-01: Rejects history progress without title (400)', async () => {
      const res = await request(app)
        .post('/api/history')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ progress: 50 }); // missing title

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Title is required/i);
    });

    it('QA-HIST-02: Updates playback history progress successfully (200)', async () => {
      jest.spyOn(History, 'findOneAndUpdate').mockResolvedValue({
        userId: mockAdminUser.id,
        title: 'Inception',
        progress: 75,
      } as any);

      const res = await request(app)
        .post('/api/history')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Inception',
          mediaType: 'movie',
          progress: 75,
        });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Inception');
      expect(res.body.progress).toBe(75);
    });
  });

  describe('5. HTTP 206 Video Streaming Range Protocol QA', () => {
    const tempTestVideo = path.join(__dirname, 'test_sample_video.mp4');
    const dummyVideoBuffer = Buffer.from('TEST_VIDEO_STREAMING_BINARY_DATA_FOR_QA_CHECK_1234567890');

    beforeAll(() => {
      fs.writeFileSync(tempTestVideo, dummyVideoBuffer);
    });

    afterAll(() => {
      if (fs.existsSync(tempTestVideo)) {
        fs.unlinkSync(tempTestVideo);
      }
    });

    it('QA-STREAM-01: Streams full video file with HTTP 200 when no Range header is sent', async () => {
      jest.spyOn(Media, 'findById').mockResolvedValue({
        _id: 'sample_media_id',
        path: tempTestVideo,
        mimeType: 'video/mp4',
        type: 'video',
      } as any);

      const res = await request(app)
        .get('/api/stream/sample_media_id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('video/mp4');
      expect(Number(res.headers['content-length'])).toBe(dummyVideoBuffer.length);
    });

    it('QA-STREAM-02: Streams partial content with HTTP 206 and Content-Range for Range request', async () => {
      jest.spyOn(Media, 'findById').mockResolvedValue({
        _id: 'sample_media_id',
        path: tempTestVideo,
        mimeType: 'video/mp4',
        type: 'video',
      } as any);

      const res = await request(app)
        .get('/api/stream/sample_media_id')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Range', 'bytes=0-9');

      expect(res.status).toBe(206);
      expect(res.headers['accept-ranges']).toBe('bytes');
      expect(res.headers['content-range']).toMatch(/^bytes 0-9\/\d+$/);
      expect(Number(res.headers['content-length'])).toBe(10);
      if (res.text) {
        expect(res.text).toBe(dummyVideoBuffer.slice(0, 10).toString());
      } else if (res.body && Buffer.isBuffer(res.body)) {
        expect(res.body.toString()).toBe(dummyVideoBuffer.slice(0, 10).toString());
      }
    });
  });
});
