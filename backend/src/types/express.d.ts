export {};

declare global {
  namespace Express {
    interface Request {
      user?: any;
      googleClient?: any;
      googleUserId?: any;
    }
  }
}
