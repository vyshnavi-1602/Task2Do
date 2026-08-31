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

  // Find the active sprint for this project
  const activeSprint = await prisma.sprint.findFirst({
    where: {
      projectId,
      status: 'ACTIVE',
    },
  });

  if (!activeSprint) {
    return res.status(200).json({
      success: true,
      data: {
        sprint: null,
        columns: {
          TO_DO: [],
          IN_PROGRESS: [],
          DONE: []
        }
      }
    });
  }

  // Fetch all issues for the active sprint
  const issues = await prisma.issue.findMany({
    where: {
      projectId,
      sprintId: activeSprint.id,
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

  // Group issues by status
  const columns = {
    TO_DO: issues.filter((issue: any) => issue.status === 'TO_DO'),
    IN_PROGRESS: issues.filter((issue: any) => issue.status === 'IN_PROGRESS'),
    DONE: issues.filter((issue: any) => issue.status === 'DONE'),
  };

  res.status(200).json({
    success: true,
    data: {
      sprint: activeSprint,
      columns,
    }
  });
});
