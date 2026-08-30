import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

// Extend Express Request type to include the authenticated user payload
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
      };
    }
  }
}

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.task2do_token;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: { message: 'Unauthorized. No authentication token provided.' },
    });
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET as string) as { id: string };
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: { message: 'Unauthorized. Invalid or expired token.' },
    });
  }
};
