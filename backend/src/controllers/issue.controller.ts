import { Request, Response } from 'express';
import { prisma, Priority, ItemType } from '@task2do/schema';
import { asyncHandler } from '../utils/async-handler';

export const createIssue = asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const { title, description, priority, type, points } = req.body;
  const reporterId = req.user!.id;

  if (!title) {
    return res.status(400).json({ success: false, error: { message: 'Title is required' } });
  }

  // Atomic Issue Creation using Prisma Transaction
  // We need to increment the project's nextIssueNumber and create the issue safely.
  const issue = await prisma.$transaction(async (tx) => {
    // 1. Atomically increment the project issue number and get the updated project
    const project = await tx.project.update({
      where: { id: projectId },
      data: { nextIssueNumber: { increment: 1 } },
    });

    // The key uses the pre-incremented value conceptually, but since we just incremented,
    // the new issue number is `project.nextIssueNumber - 1`.
    const issueNum = project.nextIssueNumber - 1;
    const issueKey = `${project.key}-${issueNum}`;

    // 2. Determine rank (bottom of backlog)
    const maxRankIssue = await tx.issue.findFirst({
      where: { projectId, sprintId: null },
      orderBy: { rank: 'desc' },
    });
    const newRank = maxRankIssue ? maxRankIssue.rank + 100 : 1000;

    // 3. Create the issue
    return await tx.issue.create({
      data: {
        key: issueKey,
        title,
        description,
        priority: (priority as Priority) || 'MEDIUM',
        type: (type as ItemType) || 'TASK',
        points: points ? parseInt(points) : null,
        rank: newRank,
        projectId,
        reporterId,
      },
    });
  });

  res.status(201).json({ success: true, data: issue });
});

export const getIssues = asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const { sprintId, backlog } = req.query;

  const whereClause: any = { projectId };

  if (sprintId) {
    whereClause.sprintId = sprintId as string;
  } else if (backlog === 'true') {
    whereClause.sprintId = null;
  }

  const issues = await prisma.issue.findMany({
    where: whereClause,
    include: {
      assignee: { select: { id: true, name: true, avatarUrl: true } },
    },
    orderBy: { rank: 'asc' },
  });

  res.status(200).json({ success: true, data: issues });
});

export const getIssue = asyncHandler(async (req: Request, res: Response) => {
  const { projectId, issueId } = req.params;

  const issue = await prisma.issue.findUnique({
    where: { id: issueId, projectId },
    include: {
      assignee: { select: { id: true, name: true, avatarUrl: true } },
      reporter: { select: { id: true, name: true, avatarUrl: true } },
    },
  });

  if (!issue) {
    return res.status(404).json({ success: false, error: { message: 'Issue not found' } });
  }

  res.status(200).json({ success: true, data: issue });
});

export const updateIssue = asyncHandler(async (req: Request, res: Response) => {
  const { projectId, issueId } = req.params;
  const { title, description, status, priority, type, points, assigneeId, sprintId, rank } = req.body;

  const issue = await prisma.issue.findUnique({
    where: { id: issueId, projectId },
  });

  if (!issue) {
    return res.status(404).json({ success: false, error: { message: 'Issue not found' } });
  }

  // STATUS VALIDATION (IssueStatus Enum)
  if (status && !['TO_DO', 'IN_PROGRESS', 'DONE'].includes(status)) {
    return res.status(400).json({ success: false, error: { message: 'Invalid status value' } });
  }

  // ASSIGNEE VALIDATION (Must be workspace member)
  if (assigneeId) {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return res.status(404).json({ success: false, error: { message: 'Project not found' } });

    const member = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: { userId: assigneeId, workspaceId: project.workspaceId },
      },
    });

    if (!member) {
      return res.status(403).json({ success: false, error: { message: 'Assignee is not a member of this workspace' } });
    }
  }

  // SPRINT VALIDATION
  if (sprintId) {
    const sprint = await prisma.sprint.findUnique({
      where: { id: sprintId },
    });
    if (!sprint || sprint.projectId !== projectId) {
      return res.status(400).json({ success: false, error: { message: 'Sprint does not exist or does not belong to this project' } });
    }
  }

  // If rank or status is changing, we use a transaction to safely update and shift surrounding issues
  const updated = await prisma.$transaction(async (tx) => {
    const oldStatus = issue.status;
    const newStatus = status || oldStatus;
    const oldRank = issue.rank;
    
    // Determine the active sprint constraint. 
    // For Kanban board movements, we ensure we are shifting ranks within the SAME sprint.
    const effectiveSprintId = sprintId !== undefined ? sprintId : issue.sprintId;
    
    let newRank = rank;

    if (newRank !== undefined || newStatus !== oldStatus) {
      if (newRank === undefined) {
        // If status changed but rank didn't, append to the bottom of the new column
        const maxRankIssue = await tx.issue.findFirst({
          where: { projectId, sprintId: effectiveSprintId, status: newStatus as any },
          orderBy: { rank: 'desc' }
        });
        newRank = maxRankIssue ? maxRankIssue.rank + 1 : 1;
      }

      if (oldStatus === newStatus) {
        // Reordering within the SAME column
        if (newRank < oldRank) {
          // Moving up: shift intermediate items down
          await tx.issue.updateMany({
            where: { projectId, sprintId: effectiveSprintId, status: oldStatus, rank: { gte: newRank, lt: oldRank } },
            data: { rank: { increment: 1 } }
          });
        } else if (newRank > oldRank) {
          // Moving down: shift intermediate items up
          await tx.issue.updateMany({
            where: { projectId, sprintId: effectiveSprintId, status: oldStatus, rank: { lte: newRank, gt: oldRank } },
            data: { rank: { decrement: 1 } }
          });
        }
      } else {
        // Moving to a DIFFERENT column
        // 1. Shift old column items up to fill the gap
        await tx.issue.updateMany({
          where: { projectId, sprintId: issue.sprintId, status: oldStatus, rank: { gt: oldRank } },
          data: { rank: { decrement: 1 } }
        });

        // 2. Shift new column items down to make space
        await tx.issue.updateMany({
          where: { projectId, sprintId: effectiveSprintId, status: newStatus as any, rank: { gte: newRank } },
          data: { rank: { increment: 1 } }
        });
      }
    }

    // Finally update the issue itself
    return await tx.issue.update({
      where: { id: issueId },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(status && { status: status as any }),
        ...(priority && { priority: priority as any }),
        ...(type && { type: type as any }),
        ...(points !== undefined && { points: points ? parseInt(points) : null }),
        ...(assigneeId !== undefined && { assigneeId }),
        ...(sprintId !== undefined && { sprintId }),
        ...(newRank !== undefined && { rank: parseInt(newRank) }),
        version: { increment: 1 },
      },
      include: {
        assignee: { select: { id: true, name: true, avatarUrl: true } },
      }
    });
  });

  res.status(200).json({ success: true, data: updated });
});

export const deleteIssue = asyncHandler(async (req: Request, res: Response) => {
  const { projectId, issueId } = req.params;

  const issue = await prisma.issue.findUnique({
    where: { id: issueId, projectId },
  });

  if (!issue) {
    return res.status(404).json({ success: false, error: { message: 'Issue not found' } });
  }

  await prisma.issue.delete({
    where: { id: issueId },
  });

  res.status(200).json({ success: true, data: { message: 'Issue deleted' } });
});
