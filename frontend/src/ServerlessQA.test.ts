import { describe, it, expect } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import loginHandler from '../api/auth/login';
import profilesHandler from '../api/auth/profiles';
import switchProfileHandler from '../api/auth/switch-profile';
import spotifySearchHandler from '../api/spotify/search';
import spotifyNewReleasesHandler from '../api/spotify/new-releases';
import tmdbTrendingHandler from '../api/tmdb/trending';

function createMockReqRes(options: {
  method: string;
  headers?: Record<string, string>;
  body?: unknown;
  query?: Record<string, string>;
}) {
  const req = {
    method: options.method,
    headers: options.headers || {},
    body: options.body || {},
    query: options.query || {},
  } as unknown as VercelRequest;

  let statusCode = 0;
  let responseData: unknown = null;
  const responseHeaders: Record<string, string> = {};

  const res = {
    setHeader: (k: string, v: string) => {
      responseHeaders[k] = v;
    },
    status: (code: number) => {
      statusCode = code;
      return {
        end: () => { responseData = 'ENDED'; },
        json: (data: unknown) => { responseData = data; },
      };
    },
  } as unknown as VercelResponse;

  return { req, res, getStatus: () => statusCode, getData: () => responseData, getHeaders: () => responseHeaders };
}

describe('Serverless Auth Handlers QA', () => {
  it('QA-SL-LOGIN-01: Handles OPTIONS preflight with CORS headers on /api/auth/login', async () => {
    const { req, res, getStatus, getHeaders } = createMockReqRes({ method: 'OPTIONS' });
    await loginHandler(req, res);
    expect(getStatus()).toBe(200);
    expect(getHeaders()['Access-Control-Allow-Origin']).toBe('*');
  });

  it('QA-SL-LOGIN-02: Rejects non-POST methods on /api/auth/login with 405', async () => {
    const { req, res, getStatus, getData } = createMockReqRes({ method: 'GET' });
    await loginHandler(req, res);
    expect(getStatus()).toBe(405);
    expect(getData()).toEqual({ message: 'Method not allowed' });
  });

  it('QA-SL-PROF-01: Handles OPTIONS preflight on /api/auth/profiles', async () => {
    const { req, res, getStatus, getHeaders } = createMockReqRes({ method: 'OPTIONS' });
    await profilesHandler(req, res);
    expect(getStatus()).toBe(200);
    expect(getHeaders()['Access-Control-Allow-Origin']).toBe('*');
  });

  it('QA-SL-PROF-02: Rejects unauthenticated request without token on /api/auth/profiles with 401', async () => {
    const { req, res, getStatus, getData } = createMockReqRes({ method: 'GET' });
    await profilesHandler(req, res);
    expect(getStatus()).toBe(401);
    expect(getData()).toEqual({ message: 'No token provided' });
  });

  it('QA-SL-SWITCH-01: Handles OPTIONS preflight on /api/auth/switch-profile', async () => {
    const { req, res, getStatus } = createMockReqRes({ method: 'OPTIONS' });
    await switchProfileHandler(req, res);
    expect(getStatus()).toBe(200);
  });

  it('QA-SL-SWITCH-02: Rejects non-POST methods on /api/auth/switch-profile with 405', async () => {
    const { req, res, getStatus } = createMockReqRes({ method: 'GET' });
    await switchProfileHandler(req, res);
    expect(getStatus()).toBe(405);
  });

  it('QA-SL-SWITCH-03: Rejects unauthenticated switch-profile request with 401', async () => {
    const { req, res, getStatus, getData } = createMockReqRes({
      method: 'POST',
      body: { profileId: '123' },
    });
    await switchProfileHandler(req, res);
    expect(getStatus()).toBe(401);
    expect(getData()).toEqual({ message: 'No token provided' });
  });
});

describe('Serverless Spotify & TMDB Handlers QA', () => {
  it('QA-SL-SPOTIFY-01: Handles OPTIONS preflight on /api/spotify/search', async () => {
    const { req, res, getStatus } = createMockReqRes({ method: 'OPTIONS' });
    await spotifySearchHandler(req, res);
    expect(getStatus()).toBe(200);
  });

  it('QA-SL-SPOTIFY-02: Validates missing query parameter on /api/spotify/search with 400', async () => {
    const { req, res, getStatus, getData } = createMockReqRes({
      method: 'GET',
      query: {},
    });
    await spotifySearchHandler(req, res);
    expect(getStatus()).toBe(400);
    expect(getData()).toEqual({ error: 'Query param q is required' });
  });

  it('QA-SL-SPOTIFY-03: Handles OPTIONS preflight on /api/spotify/new-releases', async () => {
    const { req, res, getStatus } = createMockReqRes({ method: 'OPTIONS' });
    await spotifyNewReleasesHandler(req, res);
    expect(getStatus()).toBe(200);
  });

  it('QA-SL-TMDB-01: Handles OPTIONS preflight on /api/tmdb/trending', async () => {
    const { req, res, getStatus } = createMockReqRes({ method: 'OPTIONS' });
    await tmdbTrendingHandler(req, res);
    expect(getStatus()).toBe(200);
  });
});
