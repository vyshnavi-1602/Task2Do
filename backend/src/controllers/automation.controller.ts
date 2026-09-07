import { Request, Response } from 'express';
import { prisma } from '@task2do/schema';
import { asyncHandler } from '../utils/async-handler';

export const createAutomation = asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const { name, description, triggerType, triggerConfig, actionType, actionConfig } = req.body;
  const userId = req.user!.id;

  const rule = await prisma.automationRule.create({
    data: {
      name,
      description,
      triggerType,
      triggerConfig,
      actionType,
      actionConfig,
      projectId,
      creatorId: userId,
    }
  });

  res.status(201).json({ success: true, data: rule });
});

export const getAutomations = asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.params;

  const rules = await prisma.automationRule.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' }
  });

  res.status(200).json({ success: true, data: rules });
});

export const toggleAutomation = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { isActive } = req.body;

  const rule = await prisma.automationRule.update({
    where: { id },
    data: { isActive }
  });

  res.status(200).json({ success: true, data: rule });
});

export const deleteAutomation = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await prisma.automationRule.delete({ where: { id } });
  res.status(204).send();
});
