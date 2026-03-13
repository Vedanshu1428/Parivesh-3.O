import { PrismaClient } from '@prisma/client';
import { sha3_256 } from 'js-sha3';

const prisma = new PrismaClient();

async function debugChain() {
  const entries = await prisma.auditChain.findMany({
    orderBy: { id: 'asc' },
  });

  console.log(`Analyzing ${entries.length} entries...`);

  let expectedPrevHash = sha3_256('GENESIS');

  for (const entry of entries) {
    const originalPayloadJson = JSON.stringify(entry.payload || {});
    const recomputedPayloadHash = sha3_256(originalPayloadJson);

    let issues = [];

    if (recomputedPayloadHash !== entry.payloadHash) {
      issues.push(`Payload hash mismatch! DB: ${entry.payloadHash.slice(0, 8)}, Recomputed: ${recomputedPayloadHash.slice(0, 8)}`);
    }

    if (entry.prevHash !== expectedPrevHash) {
      issues.push(`Prev hash mismatch! DB expects: ${entry.prevHash.slice(0, 8)}, Global prev: ${expectedPrevHash.slice(0, 8)}`);
    }

    const recomputedChainHash = sha3_256(expectedPrevHash + recomputedPayloadHash);
    if (recomputedChainHash !== entry.chainHash) {
      issues.push(`Chain hash mismatch! DB: ${entry.chainHash.slice(0, 8)}, Recomputed: ${recomputedChainHash.slice(0, 8)}`);
    }

    if (issues.length > 0) {
      console.log(`[ID ${entry.id}] BROKEN:`);
      issues.forEach(msg => console.log(`  - ${msg}`));
      console.log(`  - Event: ${entry.eventType}`);
      console.log(`  - Payload: ${JSON.stringify(entry.payload)}`);
      // expectedPrevHash should probably continue from the BROKEN entry's stored chainHash to see if subsequent entries are okay?
      // No, for a true chain check, we stop here or continue with the recomputed one.
    }

    expectedPrevHash = entry.chainHash;
  }
}

debugChain().catch(console.error).finally(() => prisma.$disconnect());
