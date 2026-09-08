import { Request, Response } from 'express';
import { prisma } from '@task2do/schema';
import { asyncHandler } from '../utils/async-handler';

export const createDependency = asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const { blockIssueId, blockedIssueId } = req.body;

  if (!blockIssueId || !blockedIssueId) {
    return res.status(400).json({ success: false, error: { message: 'blockIssueId and blockedIssueId are required' } });
  }

  if (blockIssueId === blockedIssueId) {
    return res.status(400).json({ success: false, error: { message: 'An issue cannot block itself' } });
  }

  // Ensure both issues exist in this project
  const blockIssue = await prisma.issue.findUnique({ where: { id: blockIssueId, projectId } });
  const blockedIssue = await prisma.issue.findUnique({ where: { id: blockedIssueId, projectId } });

  if (!blockIssue || !blockedIssue) {
    return res.status(404).json({ success: false, error: { message: 'One or both issues not found' } });
  }

  // Check if dependency already exists
  const existing = await prisma.issueDependency.findUnique({
    where: {
      blockedIssueId_blockingIssueId: { blockingIssueId: blockIssueId, blockedIssueId },
    },
  });

  if (existing) {
    return res.status(409).json({ success: false, error: { message: 'Dependency already exists' } });
  }

  const dependency = await prisma.issueDependency.create({
    data: {
      blockingIssueId: blockIssueId,
      blockedIssueId,
    },
  });

  res.status(201).json({ success: true, data: dependency });
});

export const getDependencies = asyncHandler(async (req: Request, res: Response) => {
  const { projectId, issueId } = req.params;

  // Ensure issue exists
  const issue = await prisma.issue.findUnique({ where: { id: issueId, projectId } });
  if (!issue) {
    return res.status(404).json({ success: false, error: { message: 'Issue not found' } });
  }

  const blockedBy = await prisma.issueDependency.findMany({
    where: { blockedIssueId: issueId },
    include: {
      blockingIssue: { select: { id: true, key: true, title: true, status: true, assignee: { select: { name: true } } } },
    },
  });

  const blocking = await prisma.issueDependency.findMany({
    where: { blockingIssueId: issueId },
    include: {
      blockedIssue: { select: { id: true, key: true, title: true, status: true, assignee: { select: { name: true } } } },
    },
  });

  res.status(200).json({ success: true, data: { blockedBy, blocking } });
});

export const removeDependency = asyncHandler(async (req: Request, res: Response) => {
  const { projectId, blockIssueId, blockedIssueId } = req.params;

  // Validate existence
  const existing = await prisma.issueDependency.findUnique({
    where: {
      blockedIssueId_blockingIssueId: { blockingIssueId: blockIssueId, blockedIssueId },
    },
  });

  if (!existing) {
    return res.status(404).json({ success: false, error: { message: 'Dependency not found' } });
  }

  await prisma.issueDependency.delete({
    where: {
      blockedIssueId_blockingIssueId: { blockingIssueId: blockIssueId, blockedIssueId },
    },
  });

  res.status(200).json({ success: true, data: { message: 'Dependency removed' } });
});
