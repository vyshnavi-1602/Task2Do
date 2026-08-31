import { Request, Response } from 'express';
import { prisma } from '@task2do/schema';
import { asyncHandler } from '../utils/async-handler';

export const getWorkspaceDashboard = asyncHandler(async (req: Request, res: Response) => {
  const { workspaceId } = req.params;
  const userId = req.user!.id;

  // 1. StatsGrid Data
  const totalProjects = await prisma.project.count({
    where: { workspaceId }
  });

  // Calculate completed issues and in-progress issues across the workspace
  const workspaceIssues = await prisma.issue.findMany({
    where: {
      project: { workspaceId }
    },
    select: {
      id: true,
      status: true,
      assigneeId: true
    }
  });

  const completedIssuesCount = workspaceIssues.filter(i => i.status === 'DONE').length;
  const inProgressIssuesCount = workspaceIssues.filter(i => i.status === 'IN_PROGRESS').length;
  const myTasksCount = workspaceIssues.filter(i => i.assigneeId === userId).length;

  // 2. Active Sprint Summary
  // Find the most recently created ACTIVE sprint in the workspace
  const activeSprint = await prisma.sprint.findFirst({
    where: {
      project: { workspaceId },
      status: 'ACTIVE'
    },
    orderBy: { startDate: 'desc' },
    include: {
      project: { select: { id: true, name: true, key: true } },
      issues: { select: { id: true, status: true } }
    }
  });

  let activeSprintSummary = null;
  if (activeSprint && 'issues' in activeSprint) {
    const issues = (activeSprint as any).issues || [];
    const totalSprintIssues = issues.length;
    const completedSprintIssues = issues.filter((i: any) => i.status === 'DONE').length;
    activeSprintSummary = {
      id: activeSprint.id,
      name: activeSprint.name,
      projectId: (activeSprint as any).project.id,
      projectName: (activeSprint as any).project.name,
      projectKey: (activeSprint as any).project.key,
      totalIssues: totalSprintIssues,
      completedIssues: completedSprintIssues,
      progress: totalSprintIssues > 0 ? Math.round((completedSprintIssues / totalSprintIssues) * 100) : 0
    };
  }

  // 3. Project Overview Data
  // Get recent projects with issue counts
  const projects = await prisma.project.findMany({
    where: { workspaceId },
    include: {
      issues: { select: { id: true, status: true } }
    },
    orderBy: { name: 'asc' },
    take: 5
  });

  const projectOverview = projects.map(p => {
    const issues = (p as any).issues || [];
    const total = issues.length;
    const completed = issues.filter((i: any) => i.status === 'DONE').length;
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
  // Recent "My Tasks"
  const myTasks = await prisma.issue.findMany({
    where: {
      project: { workspaceId },
      assigneeId: userId,
      status: { not: 'DONE' }
    },
    include: { project: { select: { id: true, key: true } } },
    orderBy: { updatedAt: 'desc' },
    take: 5
  });

  // Recent "In Progress" Tasks
  const inProgressTasks = await prisma.issue.findMany({
    where: {
      project: { workspaceId },
      status: 'IN_PROGRESS'
    },
    include: { project: { select: { id: true, key: true } } },
    orderBy: { updatedAt: 'desc' },
    take: 5
  });

  res.status(200).json({
    success: true,
    data: {
      stats: {
        totalProjects,
        completedIssues: completedIssuesCount,
        myTasks: myTasksCount,
        inProgressIssues: inProgressIssuesCount
      },
      activeSprint: activeSprintSummary,
      projectOverview,
      tasksSummary: {
        myTasks,
        inProgressTasks
      }
    }
  });
});
