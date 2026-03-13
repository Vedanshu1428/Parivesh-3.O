import { sha3_256 } from 'js-sha3';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

interface AuditLogInput {
  eventType: string;
  actorId: string;
  applicationId?: string;
  payload?: any;
}
class AuditChainService {
  private stableStringify(obj: any): string {
    if (obj === null || typeof obj !== 'object') {
      return JSON.stringify(obj);
    }
    if (Array.isArray(obj)) {
      return '[' + obj.map(item => this.stableStringify(item)).join(',') + ']';
    }
    const keys = Object.keys(obj).sort();
    return '{' + keys.map(k => `"${k}":${this.stableStringify(obj[k])}`).join(',') + '}';
  }

  async log(input: AuditLogInput): Promise<void> {
    try {
      const payloadHash = sha3_256(this.stableStringify(input.payload || {}));

      // Get the last entry's chain hash
      const lastEntry = await prisma.auditChain.findFirst({
        orderBy: { id: 'desc' },
        select: { chainHash: true },
      });

      const prevHash = lastEntry?.chainHash || sha3_256('GENESIS');
      const chainHash = sha3_256(prevHash + payloadHash);

      await prisma.auditChain.create({
        data: {
          eventType: input.eventType,
          actorId: input.actorId,
          applicationId: input.applicationId,
          payload: input.payload || {},
          payloadHash,
          prevHash,
          chainHash,
        },
      });
    } catch (err) {
      // Non-blocking — log error but don't throw
      logger.error('Audit chain write failed:', err);
    }
  }

  /**
   * Verify the full chain integrity (SHA3-256 Merkle chain)
   */
  async verify(): Promise<{ valid: boolean; brokenAt?: number; totalEntries: number }> {
    const entries = await prisma.auditChain.findMany({
      orderBy: { id: 'asc' },
    });

    if (entries.length === 0) return { valid: true, totalEntries: 0 };

    let expectedPrevHash = sha3_256('GENESIS');

    for (const entry of entries) {
      const recomputedPayloadHash = sha3_256(this.stableStringify(entry.payload || {}));

      if (recomputedPayloadHash !== entry.payloadHash) {
        return { valid: false, brokenAt: entry.id, totalEntries: entries.length };
      }

      const recomputedChainHash = sha3_256(expectedPrevHash + recomputedPayloadHash);
      if (recomputedChainHash !== entry.chainHash) {
        return { valid: false, brokenAt: entry.id, totalEntries: entries.length };
      }

      expectedPrevHash = entry.chainHash;
    }

    return { valid: true, totalEntries: entries.length };
  }
}

export const auditChainService = new AuditChainService();
