import { Router } from 'express';
import { streamMedia } from '../controllers/streamController';
// Note: We might want a separate "token" for streaming if we want to support external players easily, 
// but for standard web player, auth middleware works if cookies/headers are sent. 
// For HTML5 video src, headers are tricky.
// Strategy: A dedicated "ticket" or "token" query param is best for src tags, 
// OR we can rely on cookies if we used them. 
// Since we use localStorage JWT, we must pass it as a query param ?token=... for the video tag to work ? 
// actually standard <video> tags don't support custom headers easily.
// Let's implement a query-param based auth for stream.

import { protect } from '../middleware/authMiddleware';
// We will make a special "protectStream" or just allow it for now and secure it later 
// or pass token in URL. Let's start simple: allow via URL param check.

const router = Router();

// Retrieve token from query for streaming
const streamAuth = (req: any, res: any, next: any) => {
  if (req.query.token) {
    req.headers.authorization = `Bearer ${req.query.token}`;
  }
  protect(req, res, next);
};

router.get('/:id', streamAuth, streamMedia);

export default router;
