"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const argon2_1 = __importDefault(require("argon2"));
const zod_1 = require("zod");
const prisma_1 = require("../utils/prisma");
const errorHandler_1 = require("../middleware/errorHandler");
const auth_1 = require("../middleware/auth");
const auditChain_1 = require("../services/auditChain");
const router = (0, express_1.Router)();
// ─── Validation schemas ───────────────────────────────────────────────────────
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters'),
    name: zod_1.z.string().min(2),
    organization: zod_1.z.string().optional(),
    phone: zod_1.z.string().optional(),
    role: zod_1.z.enum(['PROPONENT', 'SCRUTINY', 'MOM_TEAM']).default('PROPONENT'),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
});
// ─── Helpers ──────────────────────────────────────────────────────────────────
function generateTokens(user) {
    const accessToken = jsonwebtoken_1.default.sign({ sub: user.id, email: user.email, role: user.role, name: user.name }, process.env.JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jsonwebtoken_1.default.sign({ sub: user.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
    return { accessToken, refreshToken };
}
// ─── POST /api/auth/register ──────────────────────────────────────────────────
/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterInput'
 *     responses:
 *       201:
 *         description: User registered successfully
 */
router.post('/register', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const body = registerSchema.parse(req.body);
    const existing = await prisma_1.prisma.user.findUnique({ where: { email: body.email } });
    if (existing)
        throw new errorHandler_1.AppError(409, 'EMAIL_IN_USE', 'Email already registered');
    // Argon2id — memory: 64MB, iterations: 3
    const passwordHash = await argon2_1.default.hash(body.password, {
        type: argon2_1.default.argon2id,
        memoryCost: 65536, // 64 MB
        timeCost: 3,
        parallelism: 4,
    });
    // Admins can only be created by other admins — default to PROPONENT
    const role = body.role || 'PROPONENT';
    const user = await prisma_1.prisma.user.create({
        data: {
            email: body.email,
            passwordHash,
            name: body.name,
            organization: body.organization,
            phone: body.phone,
            role,
        },
        select: { id: true, email: true, name: true, role: true, organization: true, createdAt: true },
    });
    const { accessToken, refreshToken } = generateTokens({ ...user, role: user.role });
    // Write audit entry
    await auditChain_1.auditChainService.log({
        eventType: 'USER_REGISTERED',
        actorId: user.id,
        payload: { email: user.email, role: user.role },
    });
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.status(201).json({
        success: true,
        data: { user, accessToken },
    });
}));
// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const body = loginSchema.parse(req.body);
    const user = await prisma_1.prisma.user.findUnique({ where: { email: body.email } });
    if (!user || !user.isActive)
        throw new errorHandler_1.AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    const valid = await argon2_1.default.verify(user.passwordHash, body.password);
    if (!valid)
        throw new errorHandler_1.AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    const { accessToken, refreshToken } = generateTokens({
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
    });
    await auditChain_1.auditChainService.log({
        eventType: 'USER_LOGIN',
        actorId: user.id,
        payload: { email: user.email, ip: req.ip },
    });
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({
        success: true,
        data: {
            accessToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                organization: user.organization,
            },
        },
    });
}));
// ─── POST /api/auth/refresh ───────────────────────────────────────────────────
router.post('/refresh', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const token = req.cookies?.refreshToken;
    if (!token)
        throw new errorHandler_1.AppError(401, 'NO_REFRESH_TOKEN', 'Refresh token not found');
    let payload;
    try {
        payload = jsonwebtoken_1.default.verify(token, process.env.JWT_REFRESH_SECRET);
    }
    catch {
        throw new errorHandler_1.AppError(401, 'INVALID_REFRESH_TOKEN', 'Invalid or expired refresh token');
    }
    const user = await prisma_1.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive)
        throw new errorHandler_1.AppError(401, 'USER_NOT_FOUND', 'User not found');
    const { accessToken, refreshToken: newRefreshToken } = generateTokens({
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
    });
    res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({ success: true, data: { accessToken } });
}));
// ─── POST /api/auth/logout ────────────────────────────────────────────────────
router.post('/logout', auth_1.authenticate, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    await auditChain_1.auditChainService.log({
        eventType: 'USER_LOGOUT',
        actorId: req.user.id,
        payload: {},
    });
    res.clearCookie('refreshToken');
    res.json({ success: true, data: { message: 'Logged out successfully' } });
}));
// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', auth_1.authenticate, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: req.user.id },
        select: { id: true, email: true, name: true, role: true, organization: true, phone: true, createdAt: true },
    });
    if (!user)
        throw new errorHandler_1.AppError(404, 'USER_NOT_FOUND', 'User not found');
    res.json({ success: true, data: user });
}));
exports.default = router;
//# sourceMappingURL=auth.js.map