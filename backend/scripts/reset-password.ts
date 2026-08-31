import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function run() {
  try {
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = await prisma.user.update({
      where: { email: 'nakkakarthikyadav@gmail.com' },
      data: { passwordHash: hashedPassword }
    });
    console.log('Successfully reset password for:', user.email);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
