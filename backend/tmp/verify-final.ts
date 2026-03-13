import { PrismaClient } from '@prisma/client';
import { sha3_256 } from 'js-sha3';

const prisma = new PrismaClient();

// Mirror of the class method
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

async function verifyChain() {
  const entries = await prisma.auditChain.findMany({
    orderBy: { id: 'asc' },
  });

  if (entries.length === 0) {
    console.log('No entries to verify.');
    return;
  }

  let expectedPrevHash = sha3_256('GENESIS');
  console.log(`Genesis: ${expectedPrevHash.slice(0, 10)}`);

  for (const entry of entries) {
    const recomputedPayloadHash = sha3_256(stableStringify(entry.payload || {}));
    
    if (recomputedPayloadHash !== entry.payloadHash) {
      console.log(`[ID ${entry.id}] Payload mismatch!`);
      console.log(`  Stored PayHash: ${entry.payloadHash.slice(0, 10)}...`);
      console.log(`  Recomp PayHash: ${recomputedPayloadHash.slice(0, 10)}...`);
      console.log(`  Payload: ${JSON.stringify(entry.payload)}`);
      console.log(`  Stable:  ${stableStringify(entry.payload)}`);
      // We continue but the chain is already broken
    }

    const recomputedChainHash = sha3_256(expectedPrevHash + recomputedPayloadHash);
    
    if (recomputedChainHash !== entry.chainHash) {
      console.log(`[ID ${entry.id}] Chain mismatch!`);
      console.log(`  Expected Prev:  ${expectedPrevHash.slice(0, 10)}...`);
      console.log(`  Stored Prev:    ${entry.prevHash.slice(0, 10)}...`);
      console.log(`  Stored Chain:   ${entry.chainHash.slice(0, 10)}...`);
      console.log(`  Recomp Chain:   ${recomputedChainHash.slice(0, 10)}...`);
      
      // If the recomputed chain doesn't match, we have a problem.
      // Let's check if the stored chain hash matches (StoredPrev + StoredPay)
      const internalCheck = sha3_256(entry.prevHash + entry.payloadHash);
      if (internalCheck === entry.chainHash) {
        console.log(`  -> INTERNAL CHECK PASSED (entry is self-consistent with its stored prevHash)`);
      } else {
        console.log(`  -> INTERNAL CHECK FAILED (entry is NOT consistent with its own stored prevHash)`);
      }
    }

    expectedPrevHash = entry.chainHash;
  }
}

verifyChain().catch(console.error).finally(() => prisma.$disconnect());
