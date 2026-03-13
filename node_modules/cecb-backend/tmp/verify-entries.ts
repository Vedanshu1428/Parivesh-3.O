import { PrismaClient } from '@prisma/client';
import { sha3_256 } from 'js-sha3';

const prisma = new PrismaClient();

async function checkChain() {
  const entries = await prisma.auditChain.findMany({
    orderBy: { id: 'asc' },
    take: 3
  });

  const GENESIS = sha3_256('GENESIS');
  console.log(`Genesis: ${GENESIS}`);

  for (const entry of entries) {
    console.log(`\n--- Entry ID ${entry.id} ---`);
    console.log(`Event: ${entry.eventType}`);
    console.log(`Payload: ${JSON.stringify(entry.payload)}`);
    console.log(`Stored PayloadHash: ${entry.payloadHash}`);
    const actualPayloadHash = sha3_256(JSON.stringify(entry.payload || {}));
    console.log(`Actual PayloadHash: ${actualPayloadHash}`);

    console.log(`Stored PrevHash:    ${entry.prevHash}`);
    console.log(`Stored ChainHash:   ${entry.chainHash}`);
    
    const recomputedChainHash = sha3_256(entry.prevHash + entry.payloadHash);
    console.log(`Recomputed Chain:   ${recomputedChainHash}`);
    
    if (recomputedChainHash !== entry.chainHash) {
      console.log('!!! CHAIN MISMATCH !!!');
    }
  }
}

checkChain().catch(console.error).finally(() => prisma.$disconnect());
