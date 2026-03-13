"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const qrcode_1 = __importDefault(require("qrcode"));
const zod_1 = require("zod");
const prisma_1 = require("../utils/prisma");
const errorHandler_1 = require("../middleware/errorHandler");
const auth_1 = require("../middleware/auth");
const auditChain_1 = require("../services/auditChain");
const router = (0, express_1.Router)();
const CECB_UPI_ID = 'cecb.cg@sbi';
const verifySchema = zod_1.z.object({
    utrNumber: zod_1.z.string().min(12).max(22),
    amount: zod_1.z.number().positive(),
});
// ─── POST /api/payments/initiate ─────────────────────────────────────────────
router.post('/initiate', auth_1.authenticate, (0, auth_1.requireRole)(['PROPONENT']), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { applicationId } = zod_1.z.object({ applicationId: zod_1.z.string().uuid() }).parse(req.body);
    const app = await prisma_1.prisma.application.findUnique({ where: { id: applicationId } });
    if (!app)
        throw new errorHandler_1.AppError(404, 'NOT_FOUND', 'Application not found');
    if (app.proponentId !== req.user.id)
        throw new errorHandler_1.AppError(403, 'FORBIDDEN', 'Access denied');
    if (app.feePaid)
        throw new errorHandler_1.AppError(400, 'ALREADY_PAID', 'Fee already paid');
    // Calculate fee based on sector/area
    const feeAmount = app.feeAmount || calculateFee(app.sector, app.areaHa || 0);
    // Generate UPI QR code
    const upiString = `upi://pay?pa=${CECB_UPI_ID}&pn=CECB+Chhattisgarh&am=${feeAmount.toFixed(2)}&tn=ENV+CLEARANCE+${app.id.slice(0, 8).toUpperCase()}&cu=INR`;
    const qrCodeDataUrl = await qrcode_1.default.toDataURL(upiString, { width: 300, margin: 2 });
    // Save or update payment record
    const payment = await prisma_1.prisma.payment.upsert({
        where: { applicationId },
        create: { applicationId, amount: feeAmount, qrCodeUrl: qrCodeDataUrl, upiId: CECB_UPI_ID },
        update: { amount: feeAmount, qrCodeUrl: qrCodeDataUrl },
    });
    await prisma_1.prisma.application.update({
        where: { id: applicationId },
        data: { feeAmount },
    });
    res.json({ success: true, data: { payment, qrCode: qrCodeDataUrl, upiId: CECB_UPI_ID, amount: feeAmount } });
}));
// ─── POST /api/payments/verify ────────────────────────────────────────────────
router.post('/verify', auth_1.authenticate, (0, auth_1.requireRole)(['PROPONENT']), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { applicationId, utrNumber, amount } = zod_1.z.object({
        applicationId: zod_1.z.string().uuid(),
        ...verifySchema.shape,
    }).parse(req.body);
    const app = await prisma_1.prisma.application.findUnique({ where: { id: applicationId } });
    if (!app)
        throw new errorHandler_1.AppError(404, 'NOT_FOUND', 'Application not found');
    if (app.proponentId !== req.user.id)
        throw new errorHandler_1.AppError(403, 'FORBIDDEN', 'Access denied');
    const payment = await prisma_1.prisma.payment.update({
        where: { applicationId },
        data: { utrNumber, verifiedAt: new Date(), verifiedById: req.user.id },
    });
    await prisma_1.prisma.application.update({
        where: { id: applicationId },
        data: { feePaid: true },
    });
    await auditChain_1.auditChainService.log({
        eventType: 'PAYMENT_SUBMITTED',
        actorId: req.user.id,
        applicationId,
        payload: { utrNumber, amount },
    });
    res.json({ success: true, data: payment });
}));
// ─── GET /api/payments/:applicationId ────────────────────────────────────────
router.get('/:applicationId', auth_1.authenticate, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const payment = await prisma_1.prisma.payment.findUnique({
        where: { applicationId: req.params.applicationId },
        include: { verifiedBy: { select: { id: true, name: true } } },
    });
    if (!payment)
        throw new errorHandler_1.AppError(404, 'NOT_FOUND', 'Payment record not found');
    res.json({ success: true, data: payment });
}));
// ─── POST /api/payments/:applicationId/approve (scrutiny confirms UTR) ─────────
router.post('/:applicationId/approve', auth_1.authenticate, (0, auth_1.requireRole)(['SCRUTINY', 'ADMIN']), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const payment = await prisma_1.prisma.payment.update({
        where: { applicationId: req.params.applicationId },
        data: { verifiedById: req.user.id, verifiedAt: new Date() },
    });
    await prisma_1.prisma.application.update({
        where: { id: req.params.applicationId },
        data: { feePaid: true },
    });
    await auditChain_1.auditChainService.log({
        eventType: 'PAYMENT_APPROVED',
        actorId: req.user.id,
        applicationId: req.params.applicationId,
        payload: { utrNumber: payment.utrNumber },
    });
    res.json({ success: true, data: payment });
}));
function calculateFee(sector, areaHa) {
    const baseFee = {
        mining: 25000,
        thermal: 50000,
        industry: 15000,
        infrastructure: 10000,
        river: 20000,
        default: 5000,
    };
    const sectorKey = Object.keys(baseFee).find(k => sector.toLowerCase().includes(k)) || 'default';
    const base = baseFee[sectorKey];
    const areaMultiplier = Math.max(1, Math.floor(areaHa / 100));
    return Math.min(base * areaMultiplier, 500000); // Cap at ₹5 lakh
}
exports.default = router;
//# sourceMappingURL=payments.js.map