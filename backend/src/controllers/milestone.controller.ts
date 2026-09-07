import { Request, Response } from 'express';
import { prisma } from '@task2do/schema';
import { asyncHandler } from '../utils/async-handler';

export const createMilestone = asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const { title, description, startDate, dueDate } = req.body;

  if (!title) {
    return res.status(400).json({ success: false, error: { message: 'Title is required' } });
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    return res.status(404).json({ success: false, error: { message: 'Project not found' } });
  }

  const milestone = await prisma.milestone.create({
    data: {
      title,
      description,
      startDate: startDate ? new Date(startDate) : null,
      dueDate: dueDate ? new Date(dueDate) : null,
      projectId,
    },
  });

  res.status(201).json({ success: true, data: milestone });
});

export const getMilestones = asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.params;

  const milestones = await prisma.milestone.findMany({
    where: { projectId },
    include: {
      _count: {
        select: { issues: true },
      },
    },
    orderBy: { dueDate: 'asc' },
  });

  res.status(200).json({ success: true, data: milestones });
});

export const getMilestone = asyncHandler(async (req: Request, res: Response) => {
  const { projectId, milestoneId } = req.params;

  const milestone = await prisma.milestone.findUnique({
    where: { id: milestoneId, projectId },
    include: {
      issues: {
        include: {
          assignee: { select: { id: true, name: true, avatarUrl: true } },
          status: true,
        },
      },
    },
  });

  if (!milestone) {
    return res.status(404).json({ success: false, error: { message: 'Milestone not found' } });
  }

  res.status(200).json({ success: true, data: milestone });
});

export const updateMilestone = asyncHandler(async (req: Request, res: Response) => {
  const { projectId, milestoneId } = req.params;
  const { title, description, startDate, dueDate, status } = req.body;

  const milestone = await prisma.milestone.findUnique({
    where: { id: milestoneId, projectId },
  });

  if (!milestone) {
    return res.status(404).json({ success: false, error: { message: 'Milestone not found' } });
  }

  const updated = await prisma.milestone.update({
    where: { id: milestoneId },
    data: {
      ...(title && { title }),
      ...(description !== undefined && { description }),
      ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
      ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      ...(status && { status }),
    },
  });

  res.status(200).json({ success: true, data: updated });
});

export const deleteMilestone = asyncHandler(async (req: Request, res: Response) => {
  const { projectId, milestoneId } = req.params;

  const milestone = await prisma.milestone.findUnique({
    where: { id: milestoneId, projectId },
  });

  if (!milestone) {
    return res.status(404).json({ success: false, error: { message: 'Milestone not found' } });
  }

  await prisma.milestone.delete({
    where: { id: milestoneId },
  });

  res.status(200).json({ success: true, data: { message: 'Milestone deleted' } });
});
