import { PrismaClient } from '@prisma/client';
import { sha3_256 } from 'js-sha3';

const prisma = new PrismaClient();

async function debugChain() {
  console.log(`Hash of {}: ${sha3_256(JSON.stringify({}))}`);
  console.log(`Hash of undefined payload ({}): ${sha3_256(JSON.stringify({}))}`);

  const entries = await prisma.auditChain.findMany({
    orderBy: { id: 'asc' },
  });

  console.log(`Analyzing ${entries.length} entries...`);

  let expectedPrevHash = sha3_256('GENESIS');

  for (const entry of entries) {
    const payloadJson = JSON.stringify(entry.payload || {});
    const recomputedPayloadHash = sha3_256(payloadJson);

    if (recomputedPayloadHash !== entry.payloadHash) {
      console.log(`[ID ${entry.id}] Payload Mismatch: DB says ${entry.payloadHash.slice(0, 8)}, Recomputed ${recomputedPayloadHash.slice(0, 8)}`);
      console.log(`  - DB Payload: ${JSON.stringify(entry.payload)}`);
      console.log(`  - Recomputed Payload JSON: ${payloadJson}`);
    }

    const recomputedChainHash = sha3_256(expectedPrevHash + entry.payloadHash); // Use DB's payloadHash to check chain continuity
    if (recomputedChainHash !== entry.chainHash) {
      console.log(`[ID ${entry.id}] Chain Mismatch: DB says ${entry.chainHash.slice(0, 8)}, Recomputed ${recomputedChainHash.slice(0, 8)}`);
      console.log(`  - Prev Hash: ${expectedPrevHash.slice(0, 8)}`);
    }

    expectedPrevHash = entry.chainHash;
  }
}

debugChain().catch(console.error).finally(() => prisma.$disconnect());
