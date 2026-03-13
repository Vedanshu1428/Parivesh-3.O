import { PrismaClient } from '@prisma/client';
import { sha3_256 } from 'js-sha3';

const prisma = new PrismaClient();

async function testHacks() {
  const entry = await prisma.auditChain.findUnique({ where: { id: 1 } });
  if (!entry) return;

  const prev = entry.prevHash;
  const pay = entry.payloadHash;
  const stored = entry.chainHash;

  console.log(`Prev:    ${prev.slice(0, 10)}...`);
  console.log(`Payload: ${pay.slice(0, 10)}...`);
  console.log(`Stored:  ${stored.slice(0, 10)}...`);

  const v1 = sha3_256(prev + pay);
  const v2 = sha3_256(pay + prev);
  const v3 = sha3_256(Buffer.concat([Buffer.from(prev, 'hex'), Buffer.from(pay, 'hex')]));
  const v4 = sha3_256(Buffer.concat([Buffer.from(pay, 'hex'), Buffer.from(prev, 'hex')]));
  const v5 = sha3_256(prev + ":" + pay);
  const v6 = sha3_256(prev + pay + entry.eventType);

  console.log(`Prev+Pay:       ${v1.slice(0, 10)}`);
  console.log(`Pay+Prev:       ${v2.slice(0, 10)}`);
  console.log(`Buffer(P+P):    ${v3.slice(0, 10)}`);
  console.log(`Buffer(Pay+P):  ${v4.slice(0, 10)}`);
  console.log(`Prev:Pay:       ${v5.slice(0, 10)}`);
  console.log(`With Type:      ${v6.slice(0, 10)}`);

  if (v1 === stored) console.log('MATCH V1');
  if (v2 === stored) console.log('MATCH V2');
  if (v3 === stored) console.log('MATCH V3');
  if (v4 === stored) console.log('MATCH V4');
  if (v5 === stored) console.log('MATCH V5');
  if (v6 === stored) console.log('MATCH V6');
}

testHacks().catch(console.error).finally(() => prisma.$disconnect());
