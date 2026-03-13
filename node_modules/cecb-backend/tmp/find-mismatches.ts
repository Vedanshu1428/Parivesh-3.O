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

async function findMismatches() {
  const entries = await prisma.auditChain.findMany();
  console.log(`Checking ${entries.length} entries...`);

  for (const entry of entries) {
    const payload = entry.payload as any;
    if (payload && payload.utr && !payload.utrNumber) {
       const fixedPayload = { ...payload, utrNumber: payload.utr };
       delete fixedPayload.utr;
       const fixedHash = sha3_256(stableStringify(fixedPayload));
       if (fixedHash === entry.payloadHash) {
         console.log(`[ID ${entry.id}] Found fixable mismatch (utr -> utrNumber)`);
       }
    }
    
    // Check general mismatch
    const currentHash = sha3_256(stableStringify(payload || {}));
    if (currentHash !== entry.payloadHash) {
       // Check if simple stringify matches (maybe it wasn't stable when logged)
       const simpleHash = sha3_256(JSON.stringify(payload || {}));
       if (simpleHash === entry.payloadHash) {
         console.log(`[ID ${entry.id}] Mismatch: Was logged with simple stringify, not stable.`);
       } else {
         // Check the "utr" thing specifically if not already caught
         if (!(payload && payload.utr)) {
            console.log(`[ID ${entry.id}] UNKNOWN MISMATCH`);
         }
       }
    }
  }
}

findMismatches().catch(console.error).finally(() => prisma.$disconnect());
