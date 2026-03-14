"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../utils/prisma");
const errorHandler_1 = require("../middleware/errorHandler");
const auth_1 = require("../middleware/auth");
const auditChain_1 = require("../services/auditChain");
const server_1 = require("../server");
const router = (0, express_1.Router)();
// ─── Status transition map ────────────────────────────────────────────────────
const ALLOWED_TRANSITIONS = {
    DRAFT: ['SUBMITTED'],
    SUBMITTED: ['UNDER_SCRUTINY'],
    UNDER_SCRUTINY: ['EDS', 'REFERRED'],
    EDS: ['UNDER_SCRUTINY'],
    REFERRED: ['MOM_GENERATED'],
    MOM_GENERATED: ['FINALIZED'],
    FINALIZED: [],
};
function assertValidTransition(current, next) {
    const allowed = ALLOWED_TRANSITIONS[current];
    if (!allowed.includes(next)) {
        throw new errorHandler_1.AppError(400, 'INVALID_STATUS_TRANSITION', `Cannot transition from ${current} to ${next}. Allowed: ${allowed.join(', ') || 'none'}`);
    }
}
// ─── Schemas ──────────────────────────────────────────────────────────────────
const createApplicationSchema = zod_1.z.object({
    projectName: zod_1.z.string().min(3),
    sector: zod_1.z.string().min(2),
    description: zod_1.z.string().optional(),
    district: zod_1.z.string().optional(),
    state: zod_1.z.string().default('Chhattisgarh'),
    lat: zod_1.z.number().min(-90).max(90).optional(),
    lng: zod_1.z.number().min(-180).max(180).optional(),
    areaHa: zod_1.z.number().positive().optional(),
    investmentCr: zod_1.z.number().positive().optional(),
    employmentCount: zod_1.z.number().int().nonnegative().optional(),
    feeAmount: zod_1.z.number().positive().optional(),
});
const updateApplicationSchema = createApplicationSchema.partial();
const edsSchema = zod_1.z.object({
    deficiencies: zod_1.z.array(zod_1.z.object({
        field: zod_1.z.string(),
        reason: zod_1.z.string(),
        required: zod_1.z.boolean().default(true),
    })).min(1),
    remarks: zod_1.z.string().optional(),
});
// ─── GET /api/applications — list (role-filtered) ─────────────────────────────
router.get('/', auth_1.authenticate, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { status, page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, parseInt(limit));
    const where = {};
    // Role-based filtering
    if (req.user.role === 'PROPONENT') {
        where.proponentId = req.user.id;
    }
    else if (req.user.role === 'SCRUTINY') {
        where.status = { in: ['SUBMITTED', 'UNDER_SCRUTINY', 'EDS', 'REFERRED'] };
    }
    else if (req.user.role === 'MOM_TEAM') {
        where.status = { in: ['REFERRED', 'MOM_GENERATED', 'FINALIZED'] };
    }
    if (status)
        where.status = status;
    const [applications, total] = await Promise.all([
        prisma_1.prisma.application.findMany({
            where,
            include: {
                proponent: { select: { id: true, name: true, email: true, organization: true } },
                _count: { select: { documents: true, edsNotices: true } },
            },
            orderBy: { updatedAt: 'desc' },
            skip: (pageNum - 1) * limitNum,
            take: limitNum,
        }),
        prisma_1.prisma.application.count({ where }),
    ]);
    res.json({
        success: true,
        data: applications,
        meta: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) },
    });
}));
// ─── POST /api/applications — create draft ────────────────────────────────────
router.post('/', auth_1.authenticate, (0, auth_1.requireRole)(['PROPONENT']), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const body = createApplicationSchema.parse(req.body);
    const application = await prisma_1.prisma.application.create({
        data: {
            ...body,
            proponentId: req.user.id,
            status: 'DRAFT',
        },
        include: {
            proponent: { select: { id: true, name: true, email: true } },
        },
    });
    await auditChain_1.auditChainService.log({
        eventType: 'APPLICATION_CREATED',
        actorId: req.user.id,
        applicationId: application.id,
        payload: { projectName: application.projectName, sector: application.sector },
    });
    res.status(201).json({ success: true, data: application });
}));
// ─── GET /api/applications/:id ────────────────────────────────────────────────
router.get('/:id', auth_1.authenticate, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const application = await prisma_1.prisma.application.findUnique({
        where: { id: req.params.id },
        include: {
            proponent: { select: { id: true, name: true, email: true, organization: true, phone: true } },
            documents: { orderBy: { uploadedAt: 'desc' } },
            payment: true,
            edsNotices: {
                orderBy: { issuedAt: 'desc' },
                include: { issuedBy: { select: { id: true, name: true } } },
            },
            gisRiskFlags: true,
            auditEvents: {
                orderBy: { createdAt: 'asc' },
                include: { actor: { select: { id: true, name: true, role: true } } },
                take: 50,
            },
        },
    });
    if (!application)
        throw new errorHandler_1.AppError(404, 'NOT_FOUND', 'Application not found');
    // Access control: proponents can only see their own
    if (req.user.role === 'PROPONENT' && application.proponentId !== req.user.id) {
        throw new errorHandler_1.AppError(403, 'FORBIDDEN', 'Access denied');
    }
    res.json({ success: true, data: application });
}));
// ─── PATCH /api/applications/:id — update draft ───────────────────────────────
router.patch('/:id', auth_1.authenticate, (0, auth_1.requireRole)(['PROPONENT']), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const body = updateApplicationSchema.parse(req.body);
    const app = await prisma_1.prisma.application.findUnique({ where: { id: req.params.id } });
    if (!app)
        throw new errorHandler_1.AppError(404, 'NOT_FOUND', 'Application not found');
    if (app.proponentId !== req.user.id)
        throw new errorHandler_1.AppError(403, 'FORBIDDEN', 'Access denied');
    if (app.status !== 'DRAFT' && app.status !== 'EDS') {
        throw new errorHandler_1.AppError(400, 'IMMUTABLE', 'Only DRAFT or EDS applications can be edited');
    }
    const updated = await prisma_1.prisma.application.update({
        where: { id: req.params.id },
        data: body,
    });
    res.json({ success: true, data: updated });
}));
// ─── POST /api/applications/:id/submit ────────────────────────────────────────
router.post('/:id/submit', auth_1.authenticate, (0, auth_1.requireRole)(['PROPONENT']), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const app = await prisma_1.prisma.application.findUnique({
        where: { id: req.params.id },
        include: { documents: true },
    });
    if (!app)
        throw new errorHandler_1.AppError(404, 'NOT_FOUND', 'Application not found');
    if (app.proponentId !== req.user.id)
        throw new errorHandler_1.AppError(403, 'FORBIDDEN', 'Access denied');
    assertValidTransition(app.status, 'SUBMITTED');
    /*
    if (app.documents.length === 0) {
      throw new AppError(400, 'MISSING_DOCUMENTS', 'At least one document must be uploaded before submission');
    }
    */
    const updated = await prisma_1.prisma.application.update({
        where: { id: req.params.id },
        data: { status: 'SUBMITTED', submittedAt: new Date() },
    });
    await auditChain_1.auditChainService.log({
        eventType: 'APPLICATION_SUBMITTED',
        actorId: req.user.id,
        applicationId: app.id,
        payload: { from: 'DRAFT', to: 'SUBMITTED' },
    });
    server_1.io.to(`application:${app.id}`).emit('status:changed', { applicationId: app.id, status: 'SUBMITTED' });
    res.json({ success: true, data: updated });
}));
// ─── POST /api/applications/:id/start-scrutiny ────────────────────────────────
router.post('/:id/start-scrutiny', auth_1.authenticate, (0, auth_1.requireRole)(['SCRUTINY', 'ADMIN']), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const app = await prisma_1.prisma.application.findUnique({ where: { id: req.params.id } });
    if (!app)
        throw new errorHandler_1.AppError(404, 'NOT_FOUND', 'Application not found');
    assertValidTransition(app.status, 'UNDER_SCRUTINY');
    const updated = await prisma_1.prisma.application.update({
        where: { id: req.params.id },
        data: {
            status: 'UNDER_SCRUTINY',
            slaDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
    });
    await auditChain_1.auditChainService.log({
        eventType: 'SCRUTINY_STARTED',
        actorId: req.user.id,
        applicationId: app.id,
        payload: { from: 'SUBMITTED', to: 'UNDER_SCRUTINY' },
    });
    server_1.io.to(`application:${app.id}`).emit('status:changed', { applicationId: app.id, status: 'UNDER_SCRUTINY' });
    res.json({ success: true, data: updated });
}));
// ─── POST /api/applications/:id/eds ───────────────────────────────────────────
router.post('/:id/eds', auth_1.authenticate, (0, auth_1.requireRole)(['SCRUTINY', 'ADMIN']), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const body = edsSchema.parse(req.body);
    const app = await prisma_1.prisma.application.findUnique({ where: { id: req.params.id } });
    if (!app)
        throw new errorHandler_1.AppError(404, 'NOT_FOUND', 'Application not found');
    assertValidTransition(app.status, 'EDS');
    const [updated, notice] = await prisma_1.prisma.$transaction([
        prisma_1.prisma.application.update({
            where: { id: req.params.id },
            data: { status: 'EDS' },
        }),
        prisma_1.prisma.edsNotice.create({
            data: {
                applicationId: app.id,
                deficiencies: body.deficiencies,
                issuedById: req.user.id,
                remarks: body.remarks,
            },
        }),
    ]);
    await auditChain_1.auditChainService.log({
        eventType: 'EDS_ISSUED',
        actorId: req.user.id,
        applicationId: app.id,
        payload: { deficiencyCount: body.deficiencies.length },
    });
    server_1.io.to(`application:${app.id}`).emit('status:changed', { applicationId: app.id, status: 'EDS' });
    server_1.io.to(`user:${app.proponentId}`).emit('notification', { type: 'EDS', applicationId: app.id });
    res.json({ success: true, data: { application: updated, notice } });
}));
// ─── POST /api/applications/:id/refer ────────────────────────────────────────
router.post('/:id/refer', auth_1.authenticate, (0, auth_1.requireRole)(['SCRUTINY', 'ADMIN']), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const app = await prisma_1.prisma.application.findUnique({ where: { id: req.params.id } });
    if (!app)
        throw new errorHandler_1.AppError(404, 'NOT_FOUND', 'Application not found');
    assertValidTransition(app.status, 'REFERRED');
    const updated = await prisma_1.prisma.application.update({
        where: { id: req.params.id },
        data: { status: 'REFERRED' },
    });
    await auditChain_1.auditChainService.log({
        eventType: 'APPLICATION_REFERRED',
        actorId: req.user.id,
        applicationId: app.id,
        payload: { from: 'UNDER_SCRUTINY', to: 'REFERRED' },
    });
    // Trigger AI gist generation via Bull queue
    const { gistQueue } = await Promise.resolve().then(() => __importStar(require('../services/gistQueue')));
    await gistQueue.add({ applicationId: app.id }, { attempts: 3, backoff: { type: 'exponential', delay: 2000 } });
    server_1.io.to(`application:${app.id}`).emit('status:changed', { applicationId: app.id, status: 'REFERRED' });
    res.json({ success: true, data: updated });
}));
// ─── POST /api/applications/:id/finalize ──────────────────────────────────────
router.post('/:id/finalize', auth_1.authenticate, (0, auth_1.requireRole)(['MOM_TEAM', 'ADMIN']), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const app = await prisma_1.prisma.application.findUnique({ where: { id: req.params.id } });
    if (!app)
        throw new errorHandler_1.AppError(404, 'NOT_FOUND', 'Application not found');
    assertValidTransition(app.status, 'FINALIZED');
    if (!app.momText)
        throw new errorHandler_1.AppError(400, 'MISSING_MOM', 'MoM text must be set before finalizing');
    const updated = await prisma_1.prisma.application.update({
        where: { id: req.params.id },
        data: { status: 'FINALIZED', momLocked: true, momLockedAt: new Date() },
    });
    await auditChain_1.auditChainService.log({
        eventType: 'MOM_FINALIZED',
        actorId: req.user.id,
        applicationId: app.id,
        payload: { from: 'MOM_GENERATED', to: 'FINALIZED' },
    });
    server_1.io.to(`application:${app.id}`).emit('status:changed', { applicationId: app.id, status: 'FINALIZED' });
    server_1.io.to(`user:${app.proponentId}`).emit('notification', { type: 'FINALIZED', applicationId: app.id });
    res.json({ success: true, data: updated });
}));
// ─── POST /api/applications/:id/resubmit (EDS → UNDER_SCRUTINY) ────────────────
router.post('/:id/resubmit', auth_1.authenticate, (0, auth_1.requireRole)(['PROPONENT']), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const app = await prisma_1.prisma.application.findUnique({ where: { id: req.params.id } });
    if (!app)
        throw new errorHandler_1.AppError(404, 'NOT_FOUND', 'Application not found');
    if (app.proponentId !== req.user.id)
        throw new errorHandler_1.AppError(403, 'FORBIDDEN', 'Access denied');
    assertValidTransition(app.status, 'UNDER_SCRUTINY');
    await prisma_1.prisma.edsNotice.updateMany({
        where: { applicationId: app.id, resolvedAt: null },
        data: { resolvedAt: new Date() },
    });
    const updated = await prisma_1.prisma.application.update({
        where: { id: req.params.id },
        data: { status: 'UNDER_SCRUTINY' },
    });
    await auditChain_1.auditChainService.log({
        eventType: 'APPLICATION_RESUBMITTED',
        actorId: req.user.id,
        applicationId: app.id,
        payload: { from: 'EDS', to: 'UNDER_SCRUTINY' },
    });
    server_1.io.to(`application:${app.id}`).emit('status:changed', { applicationId: app.id, status: 'UNDER_SCRUTINY' });
    res.json({ success: true, data: updated });
}));
exports.default = router;
//# sourceMappingURL=applications.js.map