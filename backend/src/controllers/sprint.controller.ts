import { Request, Response } from 'express';
import { prisma, Prisma, SprintStatus } from '@task2do/schema';
import { asyncHandler } from '../utils/async-handler';
import { getIO } from '../socket';

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

  if (status && sprint.status !== status) {
    if (status === 'ACTIVE') {
      getIO().to(`project:${projectId}`).emit('sprint:started', updated);
    } else if (status === 'CLOSED') {
      getIO().to(`project:${projectId}`).emit('sprint:completed', updated);
    }
  }

  res.status(200).json({ success: true, data: updated });
});

export const getActiveSprintMetrics = asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.params;

  const activeSprint = await prisma.sprint.findFirst({
    where: { projectId, status: 'ACTIVE' },
    include: {
      issues: { include: { status: true } }
    }
  });

  if (!activeSprint || !activeSprint.startDate || !activeSprint.endDate) {
    return res.status(200).json({ success: true, data: [] });
  }

  const totalPoints = activeSprint.issues.reduce((sum, issue) => sum + (issue.points || 1), 0);
  const remainingIssues = activeSprint.issues.filter(i => i.status?.title !== 'Done');
  const currentRemainingPoints = remainingIssues.reduce((sum, issue) => sum + (issue.points || 1), 0);

  // Generate days array
  const start = new Date(activeSprint.startDate);
  const end = new Date(activeSprint.endDate);
  const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
  
  const metrics = [];
  const pointsPerDay = totalPoints / (daysDiff > 0 ? daysDiff : 1);
  
  for (let i = 0; i <= daysDiff; i++) {
    const currentDay = new Date(start);
    currentDay.setDate(start.getDate() + i);
    
    // For simplicity, we just use the current remaining points for actual.
    // In a real app, we'd query IssueActivity to find exact completion dates.
    // Here we'll do a basic approximation for demonstration purposes:
    const isPastOrToday = currentDay.getTime() <= Date.now();
    
    metrics.push({
      day: `Day ${i + 1}`,
      ideal: Math.max(0, Math.round(totalPoints - (i * pointsPerDay))),
      actual: isPastOrToday ? currentRemainingPoints : null // Null for future days
    });
  }

  res.status(200).json({ success: true, data: metrics });
});
