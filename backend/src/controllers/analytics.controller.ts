import { Request, Response } from 'express';
import { prisma } from '@task2do/schema';
import { asyncHandler } from '../utils/async-handler';

export const getVelocity = asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.params;

  // Get all completed sprints for this project
  const sprints = await prisma.sprint.findMany({
    where: { 
      projectId, 
      status: 'CLOSED'
    },
    include: {
      issues: {
        include: {
          status: true
        }
      }
    },
    orderBy: {
      endDate: 'asc'
    }
  });

  const velocityData = sprints.map(sprint => {
    let completedPoints = 0;
    let totalPoints = 0;

    sprint.issues.forEach((issue: any) => {
      if (issue.points) {
        totalPoints += issue.points;
        // Assuming DONE or COMPLETED means done. We use status.title or status.category if available.
        // For MVP, if it's the rightmost column or just check status title
        if (issue.status?.title.toLowerCase().includes('done') || issue.status?.title.toLowerCase().includes('completed')) {
          completedPoints += issue.points;
        }
      }
    });

    return {
      sprintId: sprint.id,
      sprintName: sprint.name,
      totalPoints,
      completedPoints
    };
  });

  res.status(200).json({ success: true, data: velocityData });
});

export const getMemberPerformance = asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.params;

  // Find all issues in the project
  const issues = await prisma.issue.findMany({
    where: { projectId },
    include: {
      status: true,
      assignee: true,
    }
  });

  const performanceMap: Record<string, { assigneeName: string; completedIssues: number; completedPoints: number }> = {};

  issues.forEach(issue => {
    // Only count assigned issues
    if (issue.assigneeId && issue.assignee) {
      const isCompleted = issue.status?.title.toLowerCase().includes('done') || issue.status?.title.toLowerCase().includes('completed');
      
      if (!performanceMap[issue.assigneeId]) {
        performanceMap[issue.assigneeId] = {
          assigneeName: issue.assignee.name || 'Unknown',
          completedIssues: 0,
          completedPoints: 0,
        };
      }

      if (isCompleted) {
        performanceMap[issue.assigneeId].completedIssues += 1;
        performanceMap[issue.assigneeId].completedPoints += (issue.points || 0);
      }
    }
  });

  const performanceData = Object.values(performanceMap).filter(data => data.completedIssues > 0 || data.completedPoints > 0);

  // Sort by completed points descending
  performanceData.sort((a, b) => b.completedPoints - a.completedPoints);

  res.status(200).json({ success: true, data: performanceData });
});
