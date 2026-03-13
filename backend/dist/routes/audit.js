"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../utils/prisma");
const errorHandler_1 = require("../middleware/errorHandler");
const auth_1 = require("../middleware/auth");
const auditChain_1 = require("../services/auditChain");
const router = (0, express_1.Router)();
// ─── GET /api/audit/:applicationId ───────────────────────────────────────────
router.get('/:applicationId', auth_1.authenticate, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const app = await prisma_1.prisma.application.findUnique({ where: { id: req.params.applicationId } });
    if (!app)
        throw new errorHandler_1.AppError(404, 'NOT_FOUND', 'Application not found');
    if (req.user.role === 'PROPONENT' && app.proponentId !== req.user.id) {
        throw new errorHandler_1.AppError(403, 'FORBIDDEN', 'Access denied');
    }
    const events = await prisma_1.prisma.auditChain.findMany({
        where: { applicationId: req.params.applicationId },
        include: { actor: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: 'asc' },
    });
    res.json({ success: true, data: events, meta: { total: events.length } });
}));
// ─── GET /api/audit/verify ────────────────────────────────────────────────────
router.get('/chain/verify', auth_1.authenticate, (0, auth_1.requireRole)(['ADMIN']), (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    const result = await auditChain_1.auditChainService.verify();
    res.json({
        success: true,
        data: {
            ...result,
            message: result.valid
                ? 'Blockchain audit chain integrity verified — no tampering detected'
                : `Chain integrity BROKEN at entry ID: ${result.brokenAt}`,
        },
    });
}));
exports.default = router;
//# sourceMappingURL=audit.js.map