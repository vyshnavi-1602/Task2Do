import { Request, Response } from 'express';
import { prisma } from '@task2do/schema';
import { asyncHandler } from '../utils/async-handler';

export const getWorkspaceDashboard = asyncHandler(async (req: Request, res: Response) => {
  const { workspaceId } = req.params;
  const userId = req.user!.id;

  // 1. StatsGrid Data
  const totalProjects = await prisma.project.count({ where: { workspaceId } });
  const completedIssuesCount = await prisma.issue.count({ where: { project: { workspaceId }, status: { title: 'Done' } } });
  const inProgressIssuesCount = await prisma.issue.count({ where: { project: { workspaceId }, status: { title: 'In Progress' } } });
  const myTasksCount = await prisma.issue.count({ where: { project: { workspaceId }, assigneeId: userId } });

  // 2. Active Sprint Summary
  const activeSprint = await prisma.sprint.findFirst({
    where: { project: { workspaceId }, status: 'ACTIVE' },
    orderBy: { startDate: 'desc' },
    include: {
      project: { select: { id: true, name: true, key: true } },
      _count: { select: { issues: true } }
    }
  });

  let activeSprintSummary = null;
  if (activeSprint) {
    const completedSprintIssues = await prisma.issue.count({
      where: { sprintId: activeSprint.id, status: { title: 'Done' } }
    });
    const totalSprintIssues = activeSprint._count.issues;
    activeSprintSummary = {
      id: activeSprint.id,
      name: activeSprint.name,
      projectId: activeSprint.project.id,
      projectName: activeSprint.project.name,
      projectKey: activeSprint.project.key,
      totalIssues: totalSprintIssues,
      completedIssues: completedSprintIssues,
      progress: totalSprintIssues > 0 ? Math.round((completedSprintIssues / totalSprintIssues) * 100) : 0
    };
  }

  // 3. Project Overview Data
  const projects = await prisma.project.findMany({
    where: { workspaceId },
    include: {
      _count: { select: { issues: true } },
      issues: { where: { status: { title: 'Done' } }, select: { id: true } } // Workaround to get count of done issues if nested _count where is unsupported
    },
    orderBy: { name: 'asc' },
    take: 5
  });

  const projectOverview = projects.map(p => {
    const total = p._count.issues;
    const completed = p.issues.length; // From the workaround above
    const remaining = total - completed;
    return {
      id: p.id,
      name: p.name,
      key: p.key,
      totalIssues: total,
      completedIssues: completed,
      remainingIssues: remaining,
      progress: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  });

  // 4. Tasks Summary Data
  const myTasks = await prisma.issue.findMany({
    where: { project: { workspaceId }, assigneeId: userId, status: { title: { not: 'Done' } } },
    include: { project: { select: { id: true, key: true } } },
    orderBy: { updatedAt: 'desc' },
    take: 5
  });

  const inProgressTasks = await prisma.issue.findMany({
    where: { project: { workspaceId }, status: { title: 'In Progress' } },
    include: { project: { select: { id: true, key: true } } },
    orderBy: { updatedAt: 'desc' },
    take: 5
  });

  res.status(200).json({
    success: true,
    data: {
      stats: { totalProjects, completedIssues: completedIssuesCount, myTasks: myTasksCount, inProgressIssues: inProgressIssuesCount },
      activeSprint: activeSprintSummary,
      projectOverview,
      tasksSummary: { myTasks, inProgressTasks }
    }
  });
});
