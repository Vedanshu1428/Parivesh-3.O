"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const PdfPrinter = require('pdfmake');
const prisma_1 = require("../utils/prisma");
const errorHandler_1 = require("../middleware/errorHandler");
const auth_1 = require("../middleware/auth");
const auditChain_1 = require("../services/auditChain");
const router = (0, express_1.Router)();
// ─── GET /api/gist/:applicationId ────────────────────────────────────────────
router.get('/:applicationId', auth_1.authenticate, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const app = await prisma_1.prisma.application.findUnique({
        where: { id: req.params.applicationId },
        select: { id: true, gistText: true, momText: true, momLocked: true, status: true, projectName: true },
    });
    if (!app)
        throw new errorHandler_1.AppError(404, 'NOT_FOUND', 'Application not found');
    res.json({ success: true, data: app });
}));
// ─── PATCH /api/gist/:applicationId — MoM Team edits gist ────────────────────
router.patch('/:applicationId', auth_1.authenticate, (0, auth_1.requireRole)(['MOM_TEAM', 'ADMIN']), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { momText } = zod_1.z.object({ momText: zod_1.z.string().min(10) }).parse(req.body);
    const app = await prisma_1.prisma.application.findUnique({ where: { id: req.params.applicationId } });
    if (!app)
        throw new errorHandler_1.AppError(404, 'NOT_FOUND', 'Application not found');
    if (app.momLocked)
        throw new errorHandler_1.AppError(400, 'MOM_LOCKED', 'MoM is finalized and cannot be edited');
    const updated = await prisma_1.prisma.application.update({
        where: { id: req.params.applicationId },
        data: { momText },
    });
    await auditChain_1.auditChainService.log({
        eventType: 'MOM_EDITED',
        actorId: req.user.id,
        applicationId: app.id,
        payload: { charCount: momText.length },
    });
    res.json({ success: true, data: { momText: updated.momText } });
}));
// ─── POST /api/gist/:applicationId/lock ──────────────────────────────────────
router.post('/:applicationId/lock', auth_1.authenticate, (0, auth_1.requireRole)(['MOM_TEAM', 'ADMIN']), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const app = await prisma_1.prisma.application.findUnique({ where: { id: req.params.applicationId } });
    if (!app)
        throw new errorHandler_1.AppError(404, 'NOT_FOUND', 'Application not found');
    if (app.momLocked)
        throw new errorHandler_1.AppError(400, 'ALREADY_LOCKED', 'MoM already locked');
    if (!app.momText && !app.gistText)
        throw new errorHandler_1.AppError(400, 'MISSING_MOM', 'MoM text required before locking');
    // Automatically copy the gist text into momText if locking an untouched gist
    const finalMomText = app.momText || app.gistText;
    const updated = await prisma_1.prisma.application.update({
        where: { id: req.params.applicationId },
        data: { momLocked: true, momLockedAt: new Date(), status: 'FINALIZED', momText: finalMomText },
    });
    await auditChain_1.auditChainService.log({
        eventType: 'MOM_LOCKED',
        actorId: req.user.id,
        applicationId: app.id,
        payload: {},
    });
    res.json({ success: true, data: updated });
}));
// ─── GET /api/gist/:applicationId/export?format=pdf|docx ─────────────────────
router.get('/:applicationId/export', auth_1.authenticate, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const format = req.query.format || 'pdf';
    const app = await prisma_1.prisma.application.findUnique({
        where: { id: req.params.applicationId },
        include: { proponent: { select: { name: true, organization: true, email: true } } },
    });
    if (!app)
        throw new errorHandler_1.AppError(404, 'NOT_FOUND', 'Application not found');
    if (!app.momText && !app.gistText)
        throw new errorHandler_1.AppError(400, 'NO_MOM', 'MoM has not been generated yet');
    const momContent = app.momText || app.gistText || '';
    const projectName = app.projectName;
    const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
    if (format === 'pdf') {
        const fonts = {
            Helvetica: {
                normal: 'Helvetica',
                bold: 'Helvetica-Bold',
                italics: 'Helvetica-Oblique',
                bolditalics: 'Helvetica-BoldOblique'
            }
        };
        const printer = new PdfPrinter(fonts);
        const docDefinition = {
            pageSize: 'A4',
            pageMargins: [60, 70, 60, 70],
            content: [
                { text: 'CHHATTISGARH ENVIRONMENT CONSERVATION BOARD', style: 'header', alignment: 'center' },
                { text: 'MINUTES OF MEETING', style: 'subheader', alignment: 'center', margin: [0, 4, 0, 2] },
                { text: `Project: ${projectName}`, style: 'title', margin: [0, 12, 0, 4] },
                { text: `Date: ${today}`, style: 'meta', margin: [0, 0, 0, 20] },
                { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 475, y2: 0, lineWidth: 1.5 }], margin: [0, 0, 0, 16] },
                { text: momContent, style: 'body' },
                { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 475, y2: 0, lineWidth: 0.5 }], margin: [0, 30, 0, 8] },
                { text: 'Member Secretary, CECB', style: 'signature', alignment: 'right' },
                { text: `Chhattisgarh Environment Conservation Board`, style: 'signatureSub', alignment: 'right' },
            ],
            styles: {
                header: { fontSize: 14, bold: true, color: '#1B5E20' },
                subheader: { fontSize: 12, bold: true, color: '#37474F' },
                title: { fontSize: 12, bold: true },
                meta: { fontSize: 10, color: '#666' },
                body: { fontSize: 10.5, lineHeight: 1.6 },
                signature: { fontSize: 11, bold: true, margin: [0, 4, 0, 0] },
                signatureSub: { fontSize: 9, color: '#555' },
            },
            defaultStyle: { font: 'Helvetica' },
        };
        const pdfDoc = printer.createPdfKitDocument(docDefinition);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="MoM-${app.id.slice(0, 8)}.pdf"`);
        pdfDoc.pipe(res);
        pdfDoc.end();
        return;
    }
    if (format === 'docx') {
        const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = require('docx');
        const doc = new Document({
            sections: [{
                    properties: {},
                    children: [
                        new Paragraph({
                            text: "CHHATTISGARH ENVIRONMENT CONSERVATION BOARD",
                            heading: HeadingLevel.HEADING_1,
                            alignment: AlignmentType.CENTER,
                        }),
                        new Paragraph({
                            text: "MINUTES OF MEETING",
                            heading: HeadingLevel.HEADING_2,
                            alignment: AlignmentType.CENTER,
                        }),
                        new Paragraph({ text: "" }),
                        new Paragraph({
                            children: [
                                new TextRun({ text: "Project: ", bold: true }),
                                new TextRun(projectName)
                            ]
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({ text: "Date: ", bold: true }),
                                new TextRun(today)
                            ]
                        }),
                        new Paragraph({ text: "" }),
                        new Paragraph({ text: "--------------------------------------------------------------------------------", alignment: AlignmentType.CENTER }),
                        new Paragraph({ text: "" }),
                        ...momContent.split('\n').map((line) => new Paragraph({ text: line })),
                        new Paragraph({ text: "" }),
                        new Paragraph({ text: "--------------------------------------------------------------------------------", alignment: AlignmentType.CENTER }),
                        new Paragraph({ text: "" }),
                        new Paragraph({ text: "Member Secretary, CECB", alignment: AlignmentType.RIGHT }),
                        new Paragraph({ text: "Chhattisgarh Environment Conservation Board", alignment: AlignmentType.RIGHT }),
                    ],
                }],
        });
        const buffer = await Packer.toBuffer(doc);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="MoM-${app.id.slice(0, 8)}.docx"`);
        return res.send(buffer);
    }
    throw new errorHandler_1.AppError(400, 'INVALID_FORMAT', 'Format must be pdf or docx');
}));
exports.default = router;
//# sourceMappingURL=gist.js.map