"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditChainService = void 0;
const js_sha3_1 = require("js-sha3");
const prisma_1 = require("../utils/prisma");
const logger_1 = require("../utils/logger");
class AuditChainService {
    async log(input) {
        try {
            const payloadJson = JSON.stringify(input.payload || {});
            const payloadHash = (0, js_sha3_1.sha3_256)(payloadJson);
            // Get the last entry's chain hash
            const lastEntry = await prisma_1.prisma.auditChain.findFirst({
                orderBy: { id: 'desc' },
                select: { chainHash: true },
            });
            const prevHash = lastEntry?.chainHash || (0, js_sha3_1.sha3_256)('GENESIS');
            const chainHash = (0, js_sha3_1.sha3_256)(prevHash + payloadHash);
            await prisma_1.prisma.auditChain.create({
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
        }
        catch (err) {
            // Non-blocking — log error but don't throw
            logger_1.logger.error('Audit chain write failed:', err);
        }
    }
    /**
     * Verify the full chain integrity (SHA3-256 Merkle chain)
     */
    async verify() {
        const entries = await prisma_1.prisma.auditChain.findMany({
            orderBy: { id: 'asc' },
        });
        if (entries.length === 0)
            return { valid: true, totalEntries: 0 };
        let expectedPrevHash = (0, js_sha3_1.sha3_256)('GENESIS');
        for (const entry of entries) {
            const recomputedPayloadHash = (0, js_sha3_1.sha3_256)(JSON.stringify(entry.payload || {}));
            if (recomputedPayloadHash !== entry.payloadHash) {
                return { valid: false, brokenAt: entry.id, totalEntries: entries.length };
            }
            const recomputedChainHash = (0, js_sha3_1.sha3_256)(expectedPrevHash + recomputedPayloadHash);
            if (recomputedChainHash !== entry.chainHash) {
                return { valid: false, brokenAt: entry.id, totalEntries: entries.length };
            }
            expectedPrevHash = entry.chainHash;
        }
        return { valid: true, totalEntries: entries.length };
    }
}
exports.auditChainService = new AuditChainService();
//# sourceMappingURL=auditChain.js.map