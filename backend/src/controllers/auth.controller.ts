import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@task2do/schema';
import { asyncHandler } from '../utils/async-handler';
import { env } from '../config/env';

// Cookie options helper
const getCookieOptions = () => ({
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});

// Helper to strip sensitive data
const sanitizeUser = (user: any) => {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
};

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, name, password } = req.body;

  if (!email || !name || !password) {
    return res.status(400).json({
      success: false,
      error: { message: 'Name, email, and password are required' },
    });
  }

  // Check if user exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return res.status(409).json({
      success: false,
      error: { message: 'User with this email already exists' },
    });
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
    },
  });

  // Generate JWT
  const token = jwt.sign({ id: user.id }, env.JWT_SECRET as string, {
    expiresIn: env.JWT_EXPIRES_IN as any,
  });

  // Set HTTP-only cookie
  res.cookie('task2do_token', token, getCookieOptions());

  res.status(201).json({
    success: true,
    data: sanitizeUser(user),
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: { message: 'Email and password are required' },
    });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({
      success: false,
      error: { message: 'Invalid credentials' },
    });
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      error: { message: 'Invalid credentials' },
    });
  }

  const token = jwt.sign({ id: user.id }, env.JWT_SECRET as string, {
    expiresIn: env.JWT_EXPIRES_IN as any,
  });

  res.cookie('task2do_token', token, getCookieOptions());

  res.status(200).json({
    success: true,
    data: sanitizeUser(user),
  });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  res.clearCookie('task2do_token', {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
  });

  res.status(200).json({
    success: true,
    data: { message: 'Logged out successfully' },
  });
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({
      success: false,
      error: { message: 'Unauthorized' },
    });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return res.status(404).json({
      success: false,
      error: { message: 'User not found' },
    });
  }

  res.status(200).json({
    success: true,
    data: sanitizeUser(user),
  });
});
