import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

export const errorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('❌ Error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      // Only include stack trace in development
      ...(env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
};
