import { Request, Response } from 'express';
import { prisma, Priority, ItemType, Prisma } from '@task2do/schema';
import { asyncHandler } from '../utils/async-handler';
import { getIO } from '../socket';

export const createIssue = asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const { title, description, priority, type, points, parentIssueId, epicId, boardId } = req.body;
  const reporterId = req.user!.id;

  if (!title) {
    return res.status(400).json({ success: false, error: { message: 'Title is required' } });
  }

  // VALIDATE EPIC
  if (epicId) {
    const epic = await prisma.issue.findUnique({ where: { id: epicId, projectId } });
    if (!epic || epic.type !== 'EPIC') {
      return res.status(400).json({ success: false, error: { message: 'Invalid Epic' } });
    }
  }

  // VALIDATE SUB-TASK
  if (type === 'SUB_TASK') {
    if (!parentIssueId) {
      return res.status(400).json({ success: false, error: { message: 'parentIssueId is required for sub-tasks' } });
    }
    const parent = await prisma.issue.findUnique({ where: { id: parentIssueId, projectId } });
    if (!parent || parent.type === 'SUB_TASK') {
      return res.status(400).json({ success: false, error: { message: 'Invalid parent issue' } });
    }
  } else if (parentIssueId) {
    return res.status(400).json({ success: false, error: { message: 'parentIssueId can only be set for SUB_TASK' } });
  }

  // Atomic Issue Creation using Prisma Transaction
  // We need to increment the project's nextIssueNumber and create the issue safely.
  const issue = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
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

    // 3. Find target board and default column
    let targetBoardId = boardId;
    if (!targetBoardId) {
      const firstBoard = await tx.board.findFirst({
        where: { projectId },
        orderBy: { createdAt: 'asc' },
      });
      targetBoardId = firstBoard?.id;
    }

    const defaultColumn = targetBoardId ? await tx.boardColumn.findFirst({
      where: { boardId: targetBoardId },
      orderBy: { rank: 'asc' },
    }) : null;

    // 4. Create the issue
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
        parentIssueId,
        epicId,
        boardId: targetBoardId,
        statusId: defaultColumn?.id,
      },
    });
  });

  getIO().to(`project:${projectId}`).emit('issue:created', issue);

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
      epic: { select: { id: true, key: true, title: true } },
      subtasks: { select: { id: true, key: true, title: true, statusId: true, assignee: { select: { name: true } } } },
      status: true,
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
      epic: { select: { id: true, key: true, title: true } },
      parentIssue: { select: { id: true, key: true, title: true } },
      subtasks: { select: { id: true, key: true, title: true, statusId: true, assignee: { select: { name: true } } } },
      epicIssues: { select: { id: true, statusId: true } },
      status: true,
      attachments: true,
    },
  });

  if (!issue) {
    return res.status(404).json({ success: false, error: { message: 'Issue not found' } });
  }

  res.status(200).json({ success: true, data: issue });
});

export const updateIssue = asyncHandler(async (req: Request, res: Response) => {
  const { projectId, issueId } = req.params;
  const { title, description, statusId, priority, type, points, assigneeId, sprintId, rank, parentIssueId, epicId, boardId } = req.body;
  const userId = req.user!.id;

  const issue = await prisma.issue.findUnique({
    where: { id: issueId, projectId },
  });

  if (!issue) {
    return res.status(404).json({ success: false, error: { message: 'Issue not found' } });
  }

  // STATUS VALIDATION
  let statusColumn: any = null;
  if (statusId && statusId !== issue.statusId) {
    statusColumn = await prisma.boardColumn.findUnique({ where: { id: statusId } });
    if (!statusColumn) {
      return res.status(400).json({ success: false, error: { message: 'Invalid status column' } });
    }
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

  // EPIC & SUB_TASK VALIDATION
  if (epicId !== undefined && epicId !== null && epicId !== issue.epicId) {
    const epic = await prisma.issue.findUnique({ where: { id: epicId, projectId } });
    if (!epic || epic.type !== 'EPIC') {
      return res.status(400).json({ success: false, error: { message: 'Invalid Epic' } });
    }
  }

  const effectiveType = type || issue.type;
  if (effectiveType === 'SUB_TASK') {
    const newParentId = parentIssueId !== undefined ? parentIssueId : issue.parentIssueId;
    if (!newParentId) {
      return res.status(400).json({ success: false, error: { message: 'parentIssueId is required for sub-tasks' } });
    }
    if (newParentId === issue.id) {
      return res.status(400).json({ success: false, error: { message: 'Issue cannot be its own parent' } });
    }
    if (newParentId !== issue.parentIssueId) {
      const parent = await prisma.issue.findUnique({ where: { id: newParentId, projectId } });
      if (!parent || parent.type === 'SUB_TASK') {
        return res.status(400).json({ success: false, error: { message: 'Invalid parent issue' } });
      }
    }
  } else if (parentIssueId && parentIssueId !== issue.parentIssueId) {
    return res.status(400).json({ success: false, error: { message: 'parentIssueId can only be set for SUB_TASK' } });
  }

  // If rank or statusId is changing, we use a transaction to safely update and shift surrounding issues
  const updated = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const oldStatusId = issue.statusId;
    const newStatusId = statusId || oldStatusId;
    const oldRank = issue.rank;
    
    // Determine the active sprint constraint. 
    // For Kanban board movements, we ensure we are shifting ranks within the SAME sprint.
    const effectiveSprintId = sprintId !== undefined ? sprintId : issue.sprintId;
    
    let newRank = rank;

    if (newRank !== undefined || newStatusId !== oldStatusId) {
      if (newRank === undefined) {
        // If status changed but rank didn't, append to the bottom of the new column
        const maxRankIssue = await tx.issue.findFirst({
          where: { projectId, sprintId: effectiveSprintId, statusId: newStatusId as any },
          orderBy: { rank: 'desc' }
        });
        newRank = maxRankIssue ? maxRankIssue.rank + 1 : 1;
      }

      if (oldStatusId === newStatusId) {
        // Reordering within the SAME column
        if (newRank < oldRank) {
          // Moving up: shift intermediate items down
          await tx.issue.updateMany({
            where: { projectId, sprintId: effectiveSprintId, statusId: oldStatusId, rank: { gte: newRank, lt: oldRank } },
            data: { rank: { increment: 1 } }
          });
        } else if (newRank > oldRank) {
          // Moving down: shift intermediate items up
          await tx.issue.updateMany({
            where: { projectId, sprintId: effectiveSprintId, statusId: oldStatusId, rank: { lte: newRank, gt: oldRank } },
            data: { rank: { decrement: 1 } }
          });
        }
      } else {
        // Moving to a DIFFERENT column
        // 1. Shift old column items up to fill the gap
        await tx.issue.updateMany({
          where: { projectId, sprintId: issue.sprintId, statusId: oldStatusId, rank: { gt: oldRank } },
          data: { rank: { decrement: 1 } }
        });

        // 2. Shift new column items down to make space
        await tx.issue.updateMany({
          where: { projectId, sprintId: effectiveSprintId, statusId: newStatusId as any, rank: { gte: newRank } },
          data: { rank: { increment: 1 } }
        });
      }
    }

    // ACTIVITY LOGGING
    const activities = [];

    if (statusId && oldStatusId !== statusId) {
      // Need to fetch old status title for activity log if we want human readable names
      let oldTitle = 'Unknown';
      if (oldStatusId) {
         const oldCol = await tx.boardColumn.findUnique({ where: { id: oldStatusId } });
         if (oldCol) oldTitle = oldCol.title;
      }
      activities.push({ type: 'STATUS_CHANGE', oldValue: oldTitle, newValue: statusColumn.title, issueId, userId });
    }
    if (assigneeId !== undefined && issue.assigneeId !== assigneeId) {
      activities.push({ type: 'ASSIGNEE_CHANGE', oldValue: issue.assigneeId || 'Unassigned', newValue: assigneeId || 'Unassigned', issueId, userId });
    }
    if (priority && issue.priority !== priority) {
      activities.push({ type: 'PRIORITY_CHANGE', oldValue: issue.priority, newValue: priority, issueId, userId });
    }
    if (sprintId !== undefined && issue.sprintId !== sprintId) {
      activities.push({ type: 'SPRINT_CHANGE', oldValue: issue.sprintId || 'Backlog', newValue: sprintId || 'Backlog', issueId, userId });
    }
    if (title && issue.title !== title) {
      activities.push({ type: 'TITLE_CHANGE', oldValue: issue.title, newValue: title, issueId, userId });
    }
    if (description !== undefined && issue.description !== description) {
      activities.push({ type: 'DESCRIPTION_CHANGE', oldValue: null, newValue: null, issueId, userId }); // Too long to store full text, just log the change
    }
    const newPoints = points !== undefined ? (points ? parseInt(points) : null) : issue.points;
    if (points !== undefined && issue.points !== newPoints) {
      activities.push({ type: 'POINTS_CHANGE', oldValue: issue.points ? issue.points.toString() : 'None', newValue: newPoints ? newPoints.toString() : 'None', issueId, userId });
    }

    if (activities.length > 0) {
      await tx.issueActivity.createMany({ data: activities as any });
    }

    // NOTIFICATIONS
    if (assigneeId !== undefined && issue.assigneeId !== assigneeId && assigneeId !== userId && assigneeId !== null) {
      await tx.notification.create({
        data: {
          type: 'ASSIGNED',
          message: `You have been assigned to this issue.`,
          recipientId: assigneeId,
          issueId,
        }
      });
    }

    // Finally update the issue itself
    return await tx.issue.update({
      where: { id: issueId },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(newStatusId !== undefined && { statusId: newStatusId }),
        ...(priority && { priority: priority as any }),
        ...(type && { type: type as any }),
        ...(points !== undefined && { points: newPoints }),
        ...(assigneeId !== undefined && { assigneeId }),
        ...(sprintId !== undefined && { sprintId }),
        ...(boardId !== undefined && { boardId }),
        ...(newRank !== undefined && { rank: parseInt(newRank as string) }),
        ...(parentIssueId !== undefined && { parentIssueId }),
        ...(epicId !== undefined && { epicId }),
        version: { increment: 1 },
      },
      include: {
        assignee: { select: { id: true, name: true, avatarUrl: true } },
        epic: { select: { id: true, key: true, title: true } },
        subtasks: { select: { id: true, key: true, title: true, status: true, assignee: { select: { name: true } } } },
      }
    });
  });

  getIO().to(`project:${projectId}`).emit('issue:updated', updated);

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

  getIO().to(`project:${projectId}`).emit('issue:deleted', { id: issueId, projectId });

  res.status(200).json({ success: true, data: { message: 'Issue deleted' } });
});
// trigger reload
