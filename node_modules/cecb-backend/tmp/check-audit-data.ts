import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkData() {
  const entries = await prisma.auditChain.findMany({
    orderBy: { id: 'asc' },
    take: 5
  });
  console.log(JSON.stringify(entries, null, 2));
}

checkData().catch(console.error).finally(() => prisma.$disconnect());
