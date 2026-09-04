import { Request, Response } from 'express';
import { prisma, Prisma } from '@task2do/schema';
import { asyncHandler } from '../utils/async-handler';
import { getIO } from '../socket';

// Get comments for an issue
export const getComments = asyncHandler(async (req: Request, res: Response) => {
  const { issueId } = req.params;

  const comments = await prisma.comment.findMany({
    where: { issueId },
    include: {
      author: { select: { id: true, name: true, avatarUrl: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  res.status(200).json({ success: true, data: comments });
});

// Create a comment
export const createComment = asyncHandler(async (req: Request, res: Response) => {
  const { issueId } = req.params;
  const { text, mentionedUserIds } = req.body;
  const userId = req.user!.id;
  const member = (req as any).workspaceMember; // Attached by requireWorkspaceMember

  if (member.role === 'VIEWER') {
    return res.status(403).json({ success: false, error: { message: 'VIEWER cannot create comments' } });
  }

  if (!text || text.trim() === '') {
    return res.status(400).json({ success: false, error: { message: 'Comment text is required' } });
  }

  try {
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const issue = await tx.issue.findUnique({ 
        where: { id: issueId },
        include: { project: true }
      });
      
      if (!issue) {
        throw new Error('Issue not found');
      }

      const newComment = await tx.comment.create({
        data: { text, issueId, authorId: userId },
        include: { author: { select: { id: true, name: true, avatarUrl: true } } }
      });

      // Handle notifications
      const notificationsToCreate: any[] = [];
      const notifiedIds = new Set<string>();
      notifiedIds.add(userId); // Don't notify the author

      // 1. Mentions
      if (Array.isArray(mentionedUserIds) && mentionedUserIds.length > 0) {
        // Validate workspace membership
        const validMembers = await tx.workspaceMember.findMany({
          where: { workspaceId: issue.project.workspaceId, userId: { in: mentionedUserIds } }
        });
        
        for (const m of validMembers) {
          if (!notifiedIds.has(m.userId)) {
            notificationsToCreate.push({
              type: 'MENTIONED',
              message: `Someone mentioned you in a comment.`,
              recipientId: m.userId,
              issueId
            });
            notifiedIds.add(m.userId);
          }
        }
      }

      // 2. Commented notifications to reporter & assignee
      if (issue.reporterId && !notifiedIds.has(issue.reporterId)) {
        notificationsToCreate.push({
          type: 'COMMENTED',
          message: `Someone commented on an issue you reported.`,
          recipientId: issue.reporterId,
          issueId
        });
        notifiedIds.add(issue.reporterId);
      }
      
      if (issue.assigneeId && !notifiedIds.has(issue.assigneeId)) {
        notificationsToCreate.push({
          type: 'COMMENTED',
          message: `Someone commented on an issue assigned to you.`,
          recipientId: issue.assigneeId,
          issueId
        });
        notifiedIds.add(issue.assigneeId);
      }

      if (notificationsToCreate.length > 0) {
        await tx.notification.createMany({ data: notificationsToCreate });
      }

      return { comment: newComment, projectId: issue.projectId };
    });

    getIO().to(`project:${result.projectId}`).emit('comment:created', result.comment);

    res.status(201).json({ success: true, data: result.comment });
  } catch (err: any) {
    if (err.message === 'Issue not found') {
      return res.status(404).json({ success: false, error: { message: 'Issue not found' } });
    }
    throw err;
  }
});

// Update a comment
export const updateComment = asyncHandler(async (req: Request, res: Response) => {
  const { commentId } = req.params;
  const { text } = req.body;
  const userId = req.user!.id;

  if (!text || text.trim() === '') {
    return res.status(400).json({ success: false, error: { message: 'Comment text is required' } });
  }

  const existingComment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!existingComment) {
    return res.status(404).json({ success: false, error: { message: 'Comment not found' } });
  }

  // Only author can edit
  if (existingComment.authorId !== userId) {
    return res.status(403).json({ success: false, error: { message: 'You can only edit your own comments' } });
  }

  const updatedComment = await prisma.comment.update({
    where: { id: commentId },
    data: { text },
    include: {
      author: { select: { id: true, name: true, avatarUrl: true } },
    },
  });

  res.status(200).json({ success: true, data: updatedComment });
});

// Delete a comment
export const deleteComment = asyncHandler(async (req: Request, res: Response) => {
  const { commentId } = req.params;
  const userId = req.user!.id;
  const member = (req as any).workspaceMember; // Attached by requireWorkspaceMember

  const existingComment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!existingComment) {
    return res.status(404).json({ success: false, error: { message: 'Comment not found' } });
  }

  // Admin can delete anyone's comment. Otherwise, only author can delete.
  if (member.role !== 'ADMIN' && existingComment.authorId !== userId) {
    return res.status(403).json({ success: false, error: { message: 'You can only delete your own comments unless you are an ADMIN' } });
  }

  await prisma.comment.delete({ where: { id: commentId } });

  res.status(200).json({ success: true, data: { message: 'Comment deleted successfully' } });
});
