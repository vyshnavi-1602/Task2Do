import { Request, Response } from 'express';
import { prisma } from '@task2do/schema';
import { asyncHandler } from '../utils/async-handler';
import { getIO } from '../socket';

export const createColumn = asyncHandler(async (req: Request, res: Response) => {
  const { boardId } = req.params;
  const { title } = req.body;

  if (!title) {
    return res.status(400).json({ success: false, error: { message: 'Title is required' } });
  }

  // Get max rank
  const maxRankCol = await prisma.boardColumn.findFirst({
    where: { boardId },
    orderBy: { rank: 'desc' }
  });

  const rank = maxRankCol ? maxRankCol.rank + 100 : 1000;

  const column = await prisma.boardColumn.create({
    data: {
      title,
      rank,
      boardId
    }
  });

  res.status(201).json({ success: true, data: column });
});

export const updateColumn = asyncHandler(async (req: Request, res: Response) => {
  const { boardId, columnId } = req.params;
  const { title, rank } = req.body;

  const column = await prisma.boardColumn.findUnique({
    where: { id: columnId, boardId }
  });

  if (!column) {
    return res.status(404).json({ success: false, error: { message: 'Column not found' } });
  }

  const updated = await prisma.boardColumn.update({
    where: { id: columnId },
    data: {
      title: title !== undefined ? title : column.title,
      rank: rank !== undefined ? rank : column.rank
    }
  });

  res.status(200).json({ success: true, data: updated });
});

export const deleteColumn = asyncHandler(async (req: Request, res: Response) => {
  const { boardId, columnId } = req.params;

  const column = await prisma.boardColumn.findUnique({
    where: { id: columnId, boardId },
    include: { issues: { take: 1 } }
  });

  if (!column) {
    return res.status(404).json({ success: false, error: { message: 'Column not found' } });
  }

  if (column.issues.length > 0) {
    return res.status(400).json({ success: false, error: { message: 'Cannot delete a column that contains issues. Move them first.' } });
  }

  await prisma.boardColumn.delete({
    where: { id: columnId }
  });

  res.status(200).json({ success: true, data: { message: 'Column deleted' } });
});
