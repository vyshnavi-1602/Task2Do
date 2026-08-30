import { Request, Response } from 'express';
import { prisma } from '@task2do/schema';
import { asyncHandler } from '../utils/async-handler';

export const getHealth = asyncHandler(async (req: Request, res: Response) => {
  // Test database connection
  let dbStatus = 'disconnected';
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch (error) {
    console.error('Healthcheck DB Error:', error);
    dbStatus = 'error';
    
    // We return a 500 error because the core database is down
    return res.status(500).json({
      success: false,
      error: {
        message: 'Database connection failed',
      },
    });
  }

  res.status(200).json({
    success: true,
    data: {
      server: 'up',
      database: dbStatus,
    },
  });
});
