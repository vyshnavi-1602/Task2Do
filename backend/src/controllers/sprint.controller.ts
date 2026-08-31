import { Request, Response } from 'express';
import { prisma, Prisma, SprintStatus } from '@task2do/schema';
import { asyncHandler } from '../utils/async-handler';

export const createSprint = asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const { name, startDate, endDate } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, error: { message: 'Sprint name is required' } });
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    return res.status(404).json({ success: false, error: { message: 'Project not found' } });
  }

  const sprint = await prisma.sprint.create({
    data: {
      name,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      status: 'PLANNED',
      projectId,
    },
  });

  res.status(201).json({ success: true, data: sprint });
});

export const getSprints = asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.params;

  const sprints = await prisma.sprint.findMany({
    where: { projectId },
    include: {
      issues: {
        include: { assignee: { select: { id: true, name: true, avatarUrl: true } } },
        orderBy: { rank: 'asc' },
      },
    },
    // Sprint doesn't have createdAt. No orderBy for now.
    // Sprint doesn't have createdAt. Let's not orderBy unless we use name. Or add createdAt later if needed. For now, no orderBy.
  });

  res.status(200).json({ success: true, data: sprints });
});

export const updateSprint = asyncHandler(async (req: Request, res: Response) => {
  const { projectId, sprintId } = req.params;
  const { name, startDate, endDate, status } = req.body;

  const sprint = await prisma.sprint.findUnique({
    where: { id: sprintId, projectId },
  });

  if (!sprint) {
    return res.status(404).json({ success: false, error: { message: 'Sprint not found' } });
  }

  // Validate Status Transitions
  if (status && status !== sprint.status) {
    const validTransitions: Record<SprintStatus, SprintStatus[]> = {
      PLANNED: ['ACTIVE'],
      ACTIVE: ['CLOSED'],
      CLOSED: [], // Cannot transition out of CLOSED
    };

    if (!validTransitions[sprint.status as SprintStatus].includes(status as SprintStatus)) {
      return res.status(400).json({
        success: false,
        error: { message: `Invalid status transition from ${sprint.status} to ${status}` },
      });
    }

    // Active Limit Validation: Max ONE active sprint per project
    if (status === 'ACTIVE') {
      const activeCount = await prisma.sprint.count({
        where: { projectId, status: 'ACTIVE' },
      });
      if (activeCount > 0) {
        return res.status(400).json({
          success: false,
          error: { message: 'This project already has an active sprint.' },
        });
      }
    }
  }

  const updated = await prisma.sprint.update({
    where: { id: sprintId },
    data: {
      ...(name && { name }),
      ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
      ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
      ...(status && { status: status as SprintStatus }),
    },
  });

  res.status(200).json({ success: true, data: updated });
});
