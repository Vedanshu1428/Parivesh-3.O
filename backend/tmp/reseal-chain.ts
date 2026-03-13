import { PrismaClient } from '@prisma/client';
import { sha3_256 } from 'js-sha3';

const prisma = new PrismaClient();

function stableStringify(obj: any): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(item => stableStringify(item)).join(',') + ']';
  }
  const keys = Object.keys(obj).sort();
  return '{' + keys.map(k => `"${k}":${stableStringify(obj[k])}`).join(',') + '}';
}

async function resealChain() {
  console.log('Starting Audit Chain Reseal...');
  
  const entries = await prisma.auditChain.findMany({
    orderBy: { id: 'asc' },
  });

  let expectedPrevHash = sha3_256('GENESIS');
  let updatedCount = 0;

  for (const entry of entries) {
    const newPayloadHash = sha3_256(stableStringify(entry.payload || {}));
    const newChainHash = sha3_256(expectedPrevHash + newPayloadHash);

    if (newPayloadHash !== entry.payloadHash || newChainHash !== entry.chainHash || expectedPrevHash !== entry.prevHash) {
      console.log(`Updating ID ${entry.id}...`);
      await prisma.auditChain.update({
        where: { id: entry.id },
        data: {
          payloadHash: newPayloadHash,
          prevHash: expectedPrevHash,
          chainHash: newChainHash,
        },
      });
      updatedCount++;
      expectedPrevHash = newChainHash;
    } else {
      expectedPrevHash = entry.chainHash;
    }
  }

  console.log(`Reseal complete. Updated ${updatedCount} entries.`);
}

resealChain().catch(console.error).finally(() => prisma.$disconnect());
