import { Request, Response } from 'express';
import { prisma } from '@task2do/schema';
import { asyncHandler } from '../utils/async-handler';

export const createProject = asyncHandler(async (req: Request, res: Response) => {
  const { workspaceId } = req.params;
  const { name, key } = req.body;

  if (!name || !key) {
    return res.status(400).json({ success: false, error: { message: 'Project name and key are required' } });
  }

  // Key must be unique within the workspace
  const existing = await prisma.project.findUnique({
    where: {
      workspaceId_key: {
        workspaceId,
        key: key.toUpperCase(),
      },
    },
  });

  if (existing) {
    return res.status(409).json({ success: false, error: { message: `Project key '${key}' already exists in this workspace` } });
  }

  const project = await prisma.project.create({
    data: {
      name,
      key: key.toUpperCase(),
      workspaceId,
      boards: {
        create: [
          {
            name: 'Main Board',
            columns: {
              create: [
                { title: 'To Do', rank: 1 },
                { title: 'In Progress', rank: 2 },
                { title: 'Done', rank: 3 },
              ]
            }
          }
        ]
      }
    },
  });

  res.status(201).json({ success: true, data: project });
});

export const getProjects = asyncHandler(async (req: Request, res: Response) => {
  const { workspaceId } = req.params;

  const projects = await prisma.project.findMany({
    where: { workspaceId },
    include: {
      _count: {
        select: { issues: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  res.status(200).json({ success: true, data: projects });
});

export const getProject = asyncHandler(async (req: Request, res: Response) => {
  const { workspaceId, projectId } = req.params;

  const project = await prisma.project.findUnique({
    where: { id: projectId, workspaceId },
  });

  if (!project) {
    return res.status(404).json({ success: false, error: { message: 'Project not found' } });
  }

  res.status(200).json({ success: true, data: project });
});

export const updateProject = asyncHandler(async (req: Request, res: Response) => {
  const { workspaceId, projectId } = req.params;
  const { name, key } = req.body;

  const project = await prisma.project.findUnique({
    where: { id: projectId, workspaceId },
  });

  if (!project) {
    return res.status(404).json({ success: false, error: { message: 'Project not found' } });
  }

  if (key && key.toUpperCase() !== project.key) {
    const existing = await prisma.project.findUnique({
      where: {
        workspaceId_key: {
          workspaceId,
          key: key.toUpperCase(),
        },
      },
    });

    if (existing) {
      return res.status(409).json({ success: false, error: { message: `Project key '${key}' already exists` } });
    }
  }

  const updated = await prisma.project.update({
    where: { id: projectId },
    data: {
      ...(name && { name }),
      ...(key && { key: key.toUpperCase() }),
    },
  });

  res.status(200).json({ success: true, data: updated });
});

export const deleteProject = asyncHandler(async (req: Request, res: Response) => {
  const { workspaceId, projectId } = req.params;

  const project = await prisma.project.findUnique({
    where: { id: projectId, workspaceId },
  });

  if (!project) {
    return res.status(404).json({ success: false, error: { message: 'Project not found' } });
  }

  await prisma.project.delete({
    where: { id: projectId },
  });

  res.status(200).json({ success: true, data: { message: 'Project deleted' } });
});

export const getBoard = asyncHandler(async (req: Request, res: Response) => {
  const { workspaceId, projectId } = req.params;

  // First verify project exists and belongs to workspace
  const project = await prisma.project.findUnique({
    where: { id: projectId, workspaceId },
  });

  if (!project) {
    return res.status(404).json({ success: false, error: { message: 'Project not found' } });
  }

  const { boardId } = req.query;

  // Find the board
  let board;
  if (boardId) {
    board = await prisma.board.findUnique({
      where: { id: boardId as string, projectId }
    });
  } else {
    board = await prisma.board.findFirst({
      where: { projectId },
      orderBy: { createdAt: 'asc' }
    });
  }

  if (!board) {
    return res.status(404).json({ success: false, error: { message: 'Board not found' } });
  }

  // Fetch all board columns for this board
  const boardColumns = await prisma.boardColumn.findMany({
    where: { boardId: board.id },
    orderBy: { rank: 'asc' },
  });

  // Find the active sprint for this project
  const activeSprint = await prisma.sprint.findFirst({
    where: {
      projectId,
      status: 'ACTIVE',
    },
  });

  if (!activeSprint) {
    // Return empty board with columns but no sprint
    const columnsList = boardColumns.map((col) => ({
      ...col,
      issues: [],
    }));

    return res.status(200).json({
      success: true,
      data: {
        board,
        sprint: null,
        columns: columnsList
      }
    });
  }

  // Fetch all issues for the active sprint that belong to this board, or just fetch all issues in sprint and map to board columns?
  // Since columns belong to a board, we fetch issues that are mapped to columns of THIS board.
  // Wait, Option A: issues have `boardId`. Let's fetch issues in this sprint and this board.
  const issues = await prisma.issue.findMany({
    where: {
      projectId,
      sprintId: activeSprint.id,
      boardId: board.id,
    },
    include: {
      assignee: {
        select: { id: true, name: true, avatarUrl: true }
      }
    },
    orderBy: {
      rank: 'asc'
    }
  });

  // Group issues by statusId
  const columnsList = boardColumns.map((col) => ({
    ...col,
    issues: issues.filter((issue: any) => issue.statusId === col.id),
  }));

  res.status(200).json({
    success: true,
    data: {
      board,
      sprint: activeSprint,
      columns: columnsList,
    }
  });
});

export const getProjectActivity = asyncHandler(async (req: Request, res: Response) => {
  const { workspaceId, projectId } = req.params;

  // Verify project exists and belongs to workspace
  const project = await prisma.project.findUnique({
    where: { id: projectId, workspaceId },
  });

  if (!project) {
    return res.status(404).json({ success: false, error: { message: 'Project not found' } });
  }

  // Fetch all activities for issues in this project
  const activities = await prisma.issueActivity.findMany({
    where: {
      issue: {
        projectId
      }
    },
    include: {
      user: {
        select: { id: true, name: true, avatarUrl: true }
      },
      issue: {
        select: { id: true, key: true, title: true }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 100 // Limit to latest 100 activities for performance
  });

  res.status(200).json({
    success: true,
    data: activities
  });
});
