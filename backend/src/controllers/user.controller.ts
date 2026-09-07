import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '@task2do/schema';

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
    }

    const { name, email, avatarUrl } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, error: { message: 'Name and email are required' } });
    }

    // Check if email is already taken by another user
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser && existingUser.id !== userId) {
      return res.status(409).json({ success: false, error: { message: 'Email is already in use' } });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { name, email, avatarUrl },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    res.json({ success: true, data: updatedUser });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to update profile' } });
  }
};

export const updatePassword = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: { message: 'Current and new password are required' } });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ success: false, error: { message: 'User not found' } });
    }

    if (!user.passwordHash) {
       return res.status(400).json({ success: false, error: { message: 'Cannot update password for Google authenticated user' } });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: { message: 'Incorrect current password' } });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to update password' } });
  }
};
