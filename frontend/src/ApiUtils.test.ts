import { describe, it, expect, beforeEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getBaseUrl, getStreamUrl } from './lib/api';
import healthHandler from '../api/health';

describe('Frontend API URL Routing Functions', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('getBaseUrl returns /api by default when no tunnel is set', () => {
    expect(getBaseUrl()).toBe('/api');
  });

  it('getBaseUrl dynamically switches to tunnelUrl when desktop server is registered', () => {
    localStorage.setItem('tunnelUrl', 'https://fast-rabbit-12.loca.lt');
    expect(getBaseUrl()).toBe('https://fast-rabbit-12.loca.lt/api');
  });

  it('getStreamUrl generates standard stream path with token', () => {
    localStorage.setItem('token', 'sample_test_jwt_token');
    const url = getStreamUrl('media_12345');
    expect(url).toBe('/api/stream/media_12345?token=sample_test_jwt_token');
  });

  it('getStreamUrl routes through tunnelUrl when user is streaming remotely', () => {
    localStorage.setItem('tunnelUrl', 'https://fast-rabbit-12.loca.lt');
    localStorage.setItem('token', 'sample_test_jwt_token');
    const url = getStreamUrl('media_12345');
    expect(url).toBe('https://fast-rabbit-12.loca.lt/api/stream/media_12345?token=sample_test_jwt_token');
  });
});

describe('Vercel Serverless Health Function', () => {
  it('handles OPTIONS preflight request with 200', async () => {
    let statusCode = 0;
    const headers: Record<string, string> = {};

    const req = {
      method: 'OPTIONS',
      headers: {},
    } as unknown as VercelRequest;

    const res = {
      setHeader: (k: string, v: string) => { headers[k] = v; },
      status: (code: number) => {
        statusCode = code;
        return {
          end: () => {},
          json: () => {}
        };
      },
    } as unknown as VercelResponse;

    await healthHandler(req, res);
    expect(statusCode).toBe(200);
    expect(headers['Access-Control-Allow-Origin']).toBe('*');
  });

  it('returns valid health payload with timestamp and uptime', async () => {
    let statusCode = 0;
    let jsonBody: Record<string, unknown> | null = null;

    const req = {
      method: 'GET',
      headers: {},
    } as unknown as VercelRequest;

    const res = {
      setHeader: () => {},
      status: (code: number) => {
        statusCode = code;
        return {
          json: (body: unknown) => { jsonBody = body as Record<string, unknown>; }
        };
      },
    } as unknown as VercelResponse;

    await healthHandler(req, res);
    expect([200, 503]).toContain(statusCode);
    expect(jsonBody).toBeDefined();
    expect(jsonBody).toHaveProperty('service', 'cineora-cloud-api');
    expect(jsonBody).toHaveProperty('timestamp');
    expect(jsonBody).toHaveProperty('uptime');
  });
});
