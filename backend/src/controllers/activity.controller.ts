import { Request, Response } from 'express';
import { prisma } from '@task2do/schema';
import { asyncHandler } from '../utils/async-handler';

// Get activity history for an issue
export const getIssueActivity = asyncHandler(async (req: Request, res: Response) => {
  const { issueId } = req.params;

  const activity = await prisma.issueActivity.findMany({
    where: { issueId },
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  res.status(200).json({ success: true, data: activity });
});

export const getRecentActivities = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const activities = await prisma.issueActivity.findMany({
    where: {
      issue: {
        project: {
          workspace: {
            members: {
              some: { userId }
            }
          }
        }
      }
    },
    include: {
      user: {
        select: { id: true, name: true, avatarUrl: true }
      },
      issue: {
        select: { key: true, title: true, projectId: true, project: { select: { workspaceId: true } } }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 20
  });

  res.status(200).json({ success: true, data: activities });
});
