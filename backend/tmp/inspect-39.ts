import { PrismaClient } from '@prisma/client';
import { sha3_256 } from 'js-sha3';
import fs from 'fs';

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

async function inspectId39() {
  const entry = await prisma.auditChain.findUnique({ where: { id: 39 } });
  const prev = await prisma.auditChain.findUnique({ where: { id: 38 } });
  
  let out = '';
  if (entry) {
    out += `--- ID 39 ---\n`;
    out += `Event: ${entry.eventType}\n`;
    out += `Payload: ${JSON.stringify(entry.payload)}\n`;
    out += `Stable Payload: ${stableStringify(entry.payload)}\n`;
    out += `Stored PayloadHash: ${entry.payloadHash}\n`;
    out += `Recomp Stable Hash: ${sha3_256(stableStringify(entry.payload))}\n`;
    out += `Recomp Simple Hash: ${sha3_256(JSON.stringify(entry.payload))}\n`;
    out += `Stored PrevHash:    ${entry.prevHash}\n`;
    out += `Stored ChainHash:   ${entry.chainHash}\n`;
  }
  if (prev) {
    out += `\n--- ID 38 ---\n`;
    out += `ChainHash: ${prev.chainHash}\n`;
  }
  
  fs.writeFileSync('tmp/inspect-39.log', out);
  console.log('Log written to tmp/inspect-39.log');
}

inspectId39().catch(console.error).finally(() => prisma.$disconnect());
