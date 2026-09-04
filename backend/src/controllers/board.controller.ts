import { Request, Response } from 'express';
import { prisma } from '@task2do/schema';
import { asyncHandler } from '../utils/async-handler';

export const createBoard = asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, error: { message: 'Board name is required' } });
  }

  const board = await prisma.board.create({
    data: {
      name,
      projectId,
      columns: {
        create: [
          { title: 'To Do', rank: 1 },
          { title: 'In Progress', rank: 2 },
          { title: 'Done', rank: 3 },
        ]
      }
    }
  });

  res.status(201).json({ success: true, data: board });
});

export const getBoards = asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.params;

  const boards = await prisma.board.findMany({
    where: { projectId },
    orderBy: { createdAt: 'asc' }
  });

  res.status(200).json({ success: true, data: boards });
});

export const updateBoard = asyncHandler(async (req: Request, res: Response) => {
  const { boardId, projectId } = req.params;
  const { name } = req.body;

  const board = await prisma.board.findUnique({
    where: { id: boardId, projectId }
  });

  if (!board) {
    return res.status(404).json({ success: false, error: { message: 'Board not found' } });
  }

  const updated = await prisma.board.update({
    where: { id: boardId },
    data: { name }
  });

  res.status(200).json({ success: true, data: updated });
});

export const deleteBoard = asyncHandler(async (req: Request, res: Response) => {
  const { boardId, projectId } = req.params;

  const board = await prisma.board.findUnique({
    where: { id: boardId, projectId }
  });

  if (!board) {
    return res.status(404).json({ success: false, error: { message: 'Board not found' } });
  }

  // Ensure there's at least one board left in the project
  const boardsCount = await prisma.board.count({
    where: { projectId }
  });

  if (boardsCount <= 1) {
    return res.status(400).json({ success: false, error: { message: 'Cannot delete the only board in the project.' } });
  }

  await prisma.board.delete({
    where: { id: boardId }
  });

  res.status(200).json({ success: true, data: { message: 'Board deleted' } });
});
