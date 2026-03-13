"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../utils/prisma");
const errorHandler_1 = require("../middleware/errorHandler");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// ─── GET /api/notifications ───────────────────────────────────────────────────
router.get('/', auth_1.authenticate, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const notifications = await prisma_1.prisma.notification.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        take: 50,
    });
    const unreadCount = await prisma_1.prisma.notification.count({
        where: { userId: req.user.id, read: false },
    });
    res.json({ success: true, data: notifications, meta: { unreadCount } });
}));
// ─── PATCH /api/notifications/:id/read ────────────────────────────────────────
router.patch('/:id/read', auth_1.authenticate, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const notification = await prisma_1.prisma.notification.updateMany({
        where: { id: req.params.id, userId: req.user.id },
        data: { read: true },
    });
    res.json({ success: true, data: { updated: notification.count } });
}));
// ─── PATCH /api/notifications/read-all ────────────────────────────────────────
router.patch('/read-all', auth_1.authenticate, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    await prisma_1.prisma.notification.updateMany({
        where: { userId: req.user.id, read: false },
        data: { read: true },
    });
    res.json({ success: true, data: { message: 'All notifications marked as read' } });
}));
exports.default = router;
//# sourceMappingURL=notifications.js.map