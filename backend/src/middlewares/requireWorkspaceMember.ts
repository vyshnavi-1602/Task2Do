import { Request, Response, NextFunction } from 'express';
import { prisma, Role } from '@task2do/schema';
import { asyncHandler } from '../utils/async-handler';

// Map roles to numeric values for hierarchy comparison
const ROLE_HIERARCHY: Record<Role, number> = {
  ADMIN: 3,
  MEMBER: 2,
  VIEWER: 1,
};

export const requireWorkspaceMember = (minimumRole: Role = 'VIEWER') => {
  return asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    const workspaceId = req.params.workspaceId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Unauthorized' },
      });
    }

    if (!workspaceId) {
      return res.status(400).json({
        success: false,
        error: { message: 'Workspace ID is required' },
      });
    }

    const member = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId,
        },
      },
    });

    if (!member) {
      return res.status(403).json({
        success: false,
        error: { message: 'Forbidden: You do not have access to this workspace' },
      });
    }

    // Role Hierarchy Check
    // Example: If minimumRole is MEMBER (2), and member.role is VIEWER (1), it fails.
    // If minimumRole is VIEWER (1), and member.role is ADMIN (3), it passes.
    if (ROLE_HIERARCHY[member.role] < ROLE_HIERARCHY[minimumRole]) {
      return res.status(403).json({
        success: false,
        error: { message: `Forbidden: Requires at least ${minimumRole} role` },
      });
    }

    // Attach member info to request for downstream controllers if needed
    // We can cast req as any or extend Express Request locally
    (req as any).workspaceMember = member;

    next();
  });
};
