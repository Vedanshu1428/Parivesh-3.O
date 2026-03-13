import { PrismaClient } from '@prisma/client';
import { sha3_256 } from 'js-sha3';

const prisma = new PrismaClient();

async function debugPayload() {
  const entry = await prisma.auditChain.findUnique({ where: { id: 1 } });
  if (!entry) return;

  const storedPayloadHash = entry.payloadHash;
  const recomputedPayloadHash = sha3_256(JSON.stringify(entry.payload || {}));

  console.log(`Stored PayloadHash:     ${storedPayloadHash}`);
  console.log(`Recomputed PayloadHash: ${recomputedPayloadHash}`);
  
  if (storedPayloadHash !== recomputedPayloadHash) {
    console.log('!!! PAYLOAD HASH MISMATCH !!!');
    console.log(`Payload object: ${JSON.stringify(entry.payload)}`);
  } else {
    console.log('Payload hash matches.');
  }

  const expectedPrevHash = sha3_256('GENESIS');
  const recomputedChainHash = sha3_256(expectedPrevHash + storedPayloadHash);

  console.log(`Stored ChainHash:     ${entry.chainHash}`);
  console.log(`Recomputed ChainHash: ${recomputedChainHash}`);

  if (entry.chainHash === recomputedChainHash) {
    console.log('Chain hash matches.');
  } else {
    console.log('!!! CHAIN HASH MISMATCH !!!');
  }
}

debugPayload().catch(console.error).finally(() => prisma.$disconnect());
