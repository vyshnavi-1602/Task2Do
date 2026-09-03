import { Request, Response } from 'express';
import { prisma } from '@task2do/schema';
import { asyncHandler } from '../utils/async-handler';


export const uploadAttachment = asyncHandler(async (req: Request, res: Response) => {
  const { issueId } = req.body;
  const userId = req.user?.id;

  if (!req.file) {
    return res.status(400).json({ success: false, error: { message: 'No file uploaded' } });
  }
  if (!issueId) {
    return res.status(400).json({ success: false, error: { message: 'issueId is required' } });
  }
  if (!userId) {
    return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
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
    return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
  }

  const attachment = await prisma.attachment.findUnique({ where: { id } });
  if (!attachment) {
    return res.status(404).json({ success: false, error: { message: 'Attachment not found' } });
  }

  await prisma.attachment.delete({ where: { id } });

  res.status(200).json({
    status: 'success',
    message: 'Attachment deleted successfully',
  });
});
