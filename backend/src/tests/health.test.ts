import request from 'supertest';
import express from 'express';

const app = express();
app.get('/health', (req, res) => res.status(200).send('OK'));

describe('Health Check', () => {
  it('should return 200 OK', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toEqual(200);
    expect(res.text).toEqual('OK');
  });
});
