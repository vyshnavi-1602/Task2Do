import { Request, Response } from 'express';
import { prisma, Prisma, Role } from '@task2do/schema';
import { asyncHandler } from '../utils/async-handler';

// === WORKSPACES ===

export const createWorkspace = asyncHandler(async (req: Request, res: Response) => {
  const { name } = req.body;
  const userId = req.user!.id;

  if (!name) {
    return res.status(400).json({ success: false, error: { message: 'Workspace name is required' } });
  }

  // Prisma Transaction: Create workspace AND assign current user as ADMIN
  const workspace = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const newWorkspace = await tx.workspace.create({
      data: { name },
    });

    await tx.workspaceMember.create({
      data: {
        userId,
        workspaceId: newWorkspace.id,
        role: 'ADMIN',
      },
    });

    return newWorkspace;
  });

  res.status(201).json({ success: true, data: workspace });
});

export const getWorkspaces = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const workspaces = await prisma.workspace.findMany({
    where: {
      members: {
        some: { 
          userId,
          role: { in: ['ADMIN', 'MEMBER'] },
        },
      },
    },
    include: {
      _count: {
        select: { projects: true, members: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.status(200).json({ success: true, data: workspaces });
});

export const getWorkspace = asyncHandler(async (req: Request, res: Response) => {
  const { workspaceId } = req.params;

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      _count: {
        select: { projects: true, members: true },
      },
    },
  });

  if (!workspace) {
    return res.status(404).json({ success: false, error: { message: 'Workspace not found' } });
  }

  res.status(200).json({ success: true, data: workspace });
});

export const deleteWorkspace = asyncHandler(async (req: Request, res: Response) => {
  const { workspaceId } = req.params;

  // Verify workspace exists
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  });

  if (!workspace) {
    return res.status(404).json({ success: false, error: { message: 'Workspace not found' } });
  }

  // Delete workspace
  await prisma.workspace.delete({
    where: { id: workspaceId },
  });

  res.status(200).json({ success: true, data: { message: 'Workspace deleted successfully' } });
});

// === MEMBERS ===

export const getMembers = asyncHandler(async (req: Request, res: Response) => {
  const { workspaceId } = req.params;

  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId },
    include: {
      user: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
    },
    orderBy: { role: 'asc' }, // ADMIN first
  });

  res.status(200).json({ success: true, data: members });
});

export const addMember = asyncHandler(async (req: Request, res: Response) => {
  const { workspaceId } = req.params;
  const { email, role } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, error: { message: 'Email is required' } });
  }

  const userToAdd = await prisma.user.findUnique({ where: { email } });
  if (!userToAdd) {
    return res.status(404).json({ success: false, error: { message: 'User with this email not found' } });
  }

  const existingMember = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: { userId: userToAdd.id, workspaceId },
    },
  });

  if (existingMember) {
    return res.status(409).json({ success: false, error: { message: 'User is already a member' } });
  }

  const newMember = await prisma.workspaceMember.create({
    data: {
      userId: userToAdd.id,
      workspaceId,
      role: (role as Role) || 'MEMBER',
    },
    include: {
      user: { select: { id: true, name: true, email: true, avatarUrl: true } },
    },
  });

  res.status(201).json({ success: true, data: newMember });
});

export const updateMember= asyncHandler(async (req: Request, res: Response) => {
  const { workspaceId, userId } = req.params;
  const { role } = req.body;

  if (!role || !['ADMIN', 'MEMBER', 'VIEWER'].includes(role)) {
    return res.status(400).json({ success: false, error: { message: 'Invalid role' } });
  }

  const targetMember = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });

  if (!targetMember) {
    return res.status(404).json({ success: false, error: { message: 'Member not found' } });
  }

  // Protection against demoting the last ADMIN
  if (targetMember.role === 'ADMIN' && role !== 'ADMIN') {
    const adminCount = await prisma.workspaceMember.count({
      where: { workspaceId, role: 'ADMIN' },
    });
    if (adminCount <= 1) {
      return res.status(400).json({
        success: false,
        error: { message: 'Cannot change role. Workspace must have at least one ADMIN.' },
      });
    }
  }

  const updated = await prisma.workspaceMember.update({
    where: { userId_workspaceId: { userId, workspaceId } },
    data: { role },
  });

  res.status(200).json({ success: true, data: updated });
});

export const removeMember = asyncHandler(async (req: Request, res: Response) => {
  const { workspaceId, userId } = req.params;

  const targetMember = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });

  if (!targetMember) {
    return res.status(404).json({ success: false, error: { message: 'Member not found' } });
  }

  // Protection against removing the last ADMIN
  if (targetMember.role === 'ADMIN') {
    const adminCount = await prisma.workspaceMember.count({
      where: { workspaceId, role: 'ADMIN' },
    });
    if (adminCount <= 1) {
      return res.status(400).json({
        success: false,
        error: { message: 'Cannot remove member. Workspace must have at least one ADMIN.' },
      });
    }
  }

  await prisma.workspaceMember.delete({
    where: { userId_workspaceId: { userId, workspaceId } },
  });

  res.status(200).json({ success: true, data: { message: 'Member removed' } });
});
