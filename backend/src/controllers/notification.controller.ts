import { Request, Response } from 'express';
import { prisma } from '@task2do/schema';
import { asyncHandler } from '../utils/async-handler';

// Fetch paginated notifications for the authenticated user
export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        issue: { 
          select: { 
            id: true, 
            key: true, 
            title: true,
            projectId: true,
            project: { select: { workspaceId: true } }
          } 
        }
      }
    }),
    prisma.notification.count({ where: { recipientId: userId } })
  ]);

  res.status(200).json({
    success: true,
    data: {
      items: notifications,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    }
  });
});

// Fetch unread count
export const getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const unreadCount = await prisma.notification.count({
    where: { recipientId: userId, isRead: false }
  });

  res.status(200).json({ success: true, data: { unreadCount } });
});

// Mark single notification as read
export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const notification = await prisma.notification.findUnique({
    where: { id }
  });

  if (!notification) {
    return res.status(404).json({ success: false, error: { message: 'Notification not found' } });
  }

  if (notification.recipientId !== userId) {
    return res.status(403).json({ success: false, error: { message: 'Forbidden' } });
  }

  const updated = await prisma.notification.update({
    where: { id },
    data: { isRead: true }
  });

  res.status(200).json({ success: true, data: updated });
});

// Mark all notifications as read
export const markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;

  await prisma.notification.updateMany({
    where: { recipientId: userId, isRead: false },
    data: { isRead: true }
  });

  res.status(200).json({ success: true, data: { message: 'All notifications marked as read' } });
});
