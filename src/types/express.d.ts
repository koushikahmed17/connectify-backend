// src/types/express.d.ts
declare namespace Express {
  interface Request {
    user?: {
      id: number;
      sub?: number;
      username: string;
      email: string;
    };
  }
}
