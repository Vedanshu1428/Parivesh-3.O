"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const crypto_1 = __importDefault(require("crypto"));
const zod_1 = require("zod");
const prisma_1 = require("../utils/prisma");
const errorHandler_1 = require("../middleware/errorHandler");
const auth_1 = require("../middleware/auth");
const auditChain_1 = require("../services/auditChain");
const router = (0, express_1.Router)();
// ─── Local storage (fallback when S3 not configured) ─────────────────────────
const UPLOAD_DIR = path_1.default.join(process.cwd(), 'uploads');
if (!fs_1.default.existsSync(UPLOAD_DIR))
    fs_1.default.mkdirSync(UPLOAD_DIR, { recursive: true });
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${unique}${path_1.default.extname(file.originalname)}`);
    },
});
const fileFilter = (_req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new errorHandler_1.AppError(400, 'INVALID_FILE_TYPE', 'Only PDF, images, and Word documents are allowed'));
    }
};
const upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});
const docTypeSchema = zod_1.z.enum(['FORM_1', 'FORM_1A', 'ENVIRONMENTAL_IMPACT_ASSESSMENT',
    'PRE_FEASIBILITY_REPORT', 'MAP_TOPOSHEET', 'FOREST_CLEARANCE', 'WATER_CONSENT', 'NOC', 'OTHER']);
// ─── POST /api/documents/:applicationId — upload ──────────────────────────────
router.post('/:applicationId', auth_1.authenticate, (0, auth_1.requireRole)(['PROPONENT']), upload.single('file'), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.file)
        throw new errorHandler_1.AppError(400, 'NO_FILE', 'No file uploaded');
    const { applicationId } = req.params;
    const docType = docTypeSchema.parse(req.body.docType || 'OTHER');
    const app = await prisma_1.prisma.application.findUnique({ where: { id: applicationId } });
    if (!app)
        throw new errorHandler_1.AppError(404, 'NOT_FOUND', 'Application not found');
    if (app.proponentId !== req.user.id)
        throw new errorHandler_1.AppError(403, 'FORBIDDEN', 'Access denied');
    // Compute file hash (SHA256)
    const fileBuffer = fs_1.default.readFileSync(req.file.path);
    const fileHash = crypto_1.default.createHash('sha256').update(fileBuffer).digest('hex');
    // ClamAV stub — in production, scan with node-clamav
    const scanResult = await stubClamAVScan(req.file.path);
    if (!scanResult.clean) {
        fs_1.default.unlinkSync(req.file.path);
        throw new errorHandler_1.AppError(400, 'VIRUS_DETECTED', 'File failed security scan');
    }
    const fileUrl = process.env.USE_LOCAL_STORAGE === 'true'
        ? `/uploads/${req.file.filename}`
        : req.file.path; // In production: upload to S3 and return URL
    const document = await prisma_1.prisma.document.create({
        data: {
            applicationId,
            docType,
            fileName: req.file.originalname,
            fileUrl,
            fileHash,
            fileSizeBytes: req.file.size,
            mimeType: req.file.mimetype,
            scanned: true,
        },
    });
    await auditChain_1.auditChainService.log({
        eventType: 'DOCUMENT_UPLOADED',
        actorId: req.user.id,
        applicationId,
        payload: { docType, fileName: req.file.originalname, fileHash },
    });
    res.status(201).json({ success: true, data: document });
}));
// ─── GET /api/documents/:applicationId — list ─────────────────────────────────
router.get('/:applicationId', auth_1.authenticate, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const app = await prisma_1.prisma.application.findUnique({ where: { id: req.params.applicationId } });
    if (!app)
        throw new errorHandler_1.AppError(404, 'NOT_FOUND', 'Application not found');
    if (req.user.role === 'PROPONENT' && app.proponentId !== req.user.id) {
        throw new errorHandler_1.AppError(403, 'FORBIDDEN', 'Access denied');
    }
    const documents = await prisma_1.prisma.document.findMany({
        where: { applicationId: req.params.applicationId },
        orderBy: { uploadedAt: 'desc' },
    });
    res.json({ success: true, data: documents });
}));
// ─── DELETE /api/documents/:docId ─────────────────────────────────────────────
router.delete('/:docId', auth_1.authenticate, (0, auth_1.requireRole)(['PROPONENT', 'ADMIN']), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const doc = await prisma_1.prisma.document.findUnique({
        where: { id: req.params.docId },
        include: { application: true },
    });
    if (!doc)
        throw new errorHandler_1.AppError(404, 'NOT_FOUND', 'Document not found');
    if (req.user.role === 'PROPONENT' && doc.application.proponentId !== req.user.id) {
        throw new errorHandler_1.AppError(403, 'FORBIDDEN', 'Access denied');
    }
    if (doc.application.status !== 'DRAFT' && doc.application.status !== 'EDS') {
        throw new errorHandler_1.AppError(400, 'IMMUTABLE', 'Documents cannot be deleted after submission');
    }
    // Delete file from disk
    const filePath = path_1.default.join(UPLOAD_DIR, path_1.default.basename(doc.fileUrl));
    if (fs_1.default.existsSync(filePath))
        fs_1.default.unlinkSync(filePath);
    await prisma_1.prisma.document.delete({ where: { id: req.params.docId } });
    res.json({ success: true, data: { message: 'Document deleted' } });
}));
// ─── PATCH /api/documents/:docId/verify ───────────────────────────────────────
router.patch('/:docId/verify', auth_1.authenticate, (0, auth_1.requireRole)(['SCRUTINY', 'ADMIN']), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const doc = await prisma_1.prisma.document.findUnique({ where: { id: req.params.docId } });
    if (!doc)
        throw new errorHandler_1.AppError(404, 'NOT_FOUND', 'Document not found');
    const updated = await prisma_1.prisma.document.update({
        where: { id: req.params.docId },
        data: { verified: true },
    });
    await auditChain_1.auditChainService.log({
        eventType: 'DOCUMENT_VERIFIED',
        actorId: req.user.id,
        applicationId: doc.applicationId,
        payload: { docId: doc.id, docType: doc.docType },
    });
    res.json({ success: true, data: updated });
}));
// ─── ClamAV stub ──────────────────────────────────────────────────────────────
async function stubClamAVScan(_filePath) {
    // TODO: Replace with actual ClamAV scan:
    // const clamscan = new NodeClam().init({ clamdscan: { host: process.env.CLAMAV_HOST } });
    // const { isInfected } = await clamscan.scanFile(filePath);
    // return { clean: !isInfected };
    return { clean: true };
}
exports.default = router;
//# sourceMappingURL=documents.js.map