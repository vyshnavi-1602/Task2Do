import { Request, Response } from 'express';
import { prisma } from '@task2do/schema';
import { asyncHandler } from '../utils/async-handler';

export const globalSearch = asyncHandler(async (req: Request, res: Response) => {
  const { q, workspaceId } = req.query;
  const userId = req.user!.id;

  if (!q || typeof q !== 'string') {
    return res.status(400).json({ success: false, error: { message: 'Query parameter q is required' } });
  }

  let validWorkspaceIds: string[] = [];
  if (workspaceId && typeof workspaceId === 'string') {
    const member = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } }
    });
    if (!member) {
      return res.status(403).json({ success: false, error: { message: 'Forbidden workspace' } });
    }
    validWorkspaceIds = [workspaceId];
  } else {
    const memberships = await prisma.workspaceMember.findMany({
      where: { userId },
      select: { workspaceId: true }
    });
    validWorkspaceIds = memberships.map(m => m.workspaceId);
  }

  if (validWorkspaceIds.length === 0) {
    return res.status(200).json({ success: true, data: { issues: [], projects: [], users: [] } });
  }

  const issues = await prisma.issue.findMany({
    where: {
      project: { workspaceId: { in: validWorkspaceIds } },
      OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { key: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ]
    },
    take: 10,
    select: {
      id: true,
      title: true,
      key: true,
      projectId: true,
      project: { select: { workspaceId: true, name: true, key: true } },
      status: { select: { title: true } }
    }
  });

  const projects = await prisma.project.findMany({
    where: {
      workspaceId: { in: validWorkspaceIds },
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { key: { contains: q, mode: 'insensitive' } }
      ]
    },
    take: 5,
    select: {
      id: true,
      name: true,
      key: true,
      workspaceId: true
    }
  });

  const workspaceMembers = await prisma.workspaceMember.findMany({
    where: {
      workspaceId: { in: validWorkspaceIds },
      user: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } }
        ]
      }
    },
    take: 10,
    include: {
      user: { select: { id: true, name: true, email: true, avatarUrl: true } }
    }
  });

  const uniqueUsers = Array.from(new Map(workspaceMembers.map(m => [m.userId, m.user])).values());

  res.status(200).json({
    success: true,
    data: {
      issues,
      projects,
      users: uniqueUsers
    }
  });
});
