import { PrismaClient } from '@prisma/client';
import { sha3_256 } from 'js-sha3';

const prisma = new PrismaClient();

function stableStringify(obj: any): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    return '[' + obj.map(stableStringify).join(',') + ']';
  }

  const keys = Object.keys(obj).sort();
  return '{' + keys.map(k => `"${k}":${stableStringify(obj[k])}`).join(',') + '}';
}

async function debugStable() {
  const entry = await prisma.auditChain.findUnique({ where: { id: 1 } });
  if (!entry) return;

  const storedPayloadHash = entry.payloadHash;
  const rawJson = JSON.stringify(entry.payload);
  const stableJson = stableStringify(entry.payload);
  
  const rawHash = sha3_256(rawJson);
  const stableHash = sha3_256(stableJson);

  console.log(`Stored: ${storedPayloadHash}`);
  console.log(`Raw:    ${rawHash}`);
  console.log(`Stable: ${stableHash}`);

  if (storedPayloadHash === stableHash) {
    console.log('MATCH FOUND WITH STABLE STRINGIFY!');
  } else {
    console.log('STILL NO MATCH.');
  }
}

debugStable().catch(console.error).finally(() => prisma.$disconnect());
