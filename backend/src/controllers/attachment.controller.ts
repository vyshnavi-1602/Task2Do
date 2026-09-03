import { Request, Response } from 'express';
import { prisma } from '@task2do/schema';
import { asyncHandler } from '../utils/async-handler';
import { AppError } from '../middlewares/error.middleware';

export const uploadAttachment = asyncHandler(async (req: Request, res: Response) => {
  const { issueId } = req.body;
  const userId = req.user?.id;

  if (!req.file) {
    throw new AppError('No file uploaded', 400);
  }
  if (!issueId) {
    throw new AppError('issueId is required', 400);
  }
  if (!userId) {
    throw new AppError('Unauthorized', 401);
  }

  const { originalname, filename, mimetype, size } = req.file;
  const url = `/uploads/${filename}`;

  const attachment = await prisma.attachment.create({
    data: {
      filename: originalname,
      url,
      mimetype,
      size,
      issueId,
      uploaderId: userId,
    },
  });

  res.status(201).json({
    status: 'success',
    data: { attachment },
  });
});

export const deleteAttachment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    throw new AppError('Unauthorized', 401);
  }

  const attachment = await prisma.attachment.findUnique({ where: { id } });
  if (!attachment) {
    throw new AppError('Attachment not found', 404);
  }

  await prisma.attachment.delete({ where: { id } });

  res.status(200).json({
    status: 'success',
    message: 'Attachment deleted successfully',
  });
});
