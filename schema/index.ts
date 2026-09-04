import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export * from '@prisma/client';
export { Prisma, Role, SprintStatus, Priority, ItemType } from '@prisma/client';
