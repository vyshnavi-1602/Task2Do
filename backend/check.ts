import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const issues = await prisma.issue.findMany({
    where: {
      project: {
        key: 'MICRO'
      }
    },
    include: {
      sprint: true,
      board: true,
      statusColumn: true
    }
  });

  console.log(JSON.stringify(issues, null, 2));

  const sprints = await prisma.sprint.findMany({
    where: { project: { key: 'MICRO' } }
  });
  console.log('Sprints:', JSON.stringify(sprints, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
