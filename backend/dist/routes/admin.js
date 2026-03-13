"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const prisma_1 = require("../utils/prisma");
const errorHandler_1 = require("../middleware/errorHandler");
const auth_1 = require("../middleware/auth");
const auditChain_1 = require("../services/auditChain");
const router = (0, express_1.Router)();
// Apply auth + ADMIN role to all admin routes
router.use(auth_1.authenticate, (0, auth_1.requireRole)(['ADMIN']));
// ─── GET /api/admin/users ─────────────────────────────────────────────────────
router.get('/users', (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    const users = await prisma_1.prisma.user.findMany({
        select: { id: true, email: true, name: true, role: true, organization: true, isActive: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: users });
}));
// ─── PATCH /api/admin/users/:id/role ─────────────────────────────────────────
router.patch('/users/:id/role', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { role } = zod_1.z.object({ role: zod_1.z.nativeEnum(client_1.UserRole) }).parse(req.body);
    const user = await prisma_1.prisma.user.update({
        where: { id: req.params.id },
        data: { role },
        select: { id: true, email: true, name: true, role: true },
    });
    await auditChain_1.auditChainService.log({
        eventType: 'USER_ROLE_CHANGED',
        actorId: req.user.id,
        payload: { targetUserId: req.params.id, newRole: role },
    });
    res.json({ success: true, data: user });
}));
// ─── PATCH /api/admin/users/:id/toggle ───────────────────────────────────────
router.patch('/users/:id/toggle', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const user = await prisma_1.prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user)
        throw new errorHandler_1.AppError(404, 'NOT_FOUND', 'User not found');
    const updated = await prisma_1.prisma.user.update({
        where: { id: req.params.id },
        data: { isActive: !user.isActive },
        select: { id: true, email: true, name: true, isActive: true },
    });
    await auditChain_1.auditChainService.log({
        eventType: updated.isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
        actorId: req.user.id,
        payload: { targetUserId: req.params.id },
    });
    res.json({ success: true, data: updated });
}));
// ─── GET /api/admin/stats ─────────────────────────────────────────────────────
router.get('/stats', (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    const [totalApplications, byStatus, totalUsers, byRole, bySector, recentApplications, totalDocuments,] = await Promise.all([
        prisma_1.prisma.application.count(),
        prisma_1.prisma.application.groupBy({ by: ['status'], _count: { status: true } }),
        prisma_1.prisma.user.count(),
        prisma_1.prisma.user.groupBy({ by: ['role'], _count: { role: true } }),
        prisma_1.prisma.application.groupBy({ by: ['sector'], _count: { sector: true }, orderBy: { _count: { sector: 'desc' } }, take: 10 }),
        prisma_1.prisma.application.findMany({
            take: 8,
            orderBy: { createdAt: 'desc' },
            include: { proponent: { select: { name: true } } },
        }),
        prisma_1.prisma.document.count(),
    ]);
    res.json({
        success: true,
        data: {
            totalApplications,
            totalDocuments,
            byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count.status])),
            totalUsers,
            byRole: Object.fromEntries(byRole.map((r) => [r.role, r._count.role])),
            bySector: bySector.map(s => ({ sector: s.sector, count: s._count.sector })),
            recentApplications,
        },
    });
}));
// ─── GET/POST /api/admin/templates ───────────────────────────────────────────
router.get('/templates', (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    const templates = await prisma_1.prisma.momTemplate.findMany({ where: { isActive: true } });
    res.json({ success: true, data: templates });
}));
router.post('/templates', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const body = zod_1.z.object({ name: zod_1.z.string(), sector: zod_1.z.string().optional(), content: zod_1.z.string() }).parse(req.body);
    const template = await prisma_1.prisma.momTemplate.create({ data: body });
    res.status(201).json({ success: true, data: template });
}));
exports.default = router;
//# sourceMappingURL=admin.js.map