"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = exports.app = void 0;
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const compression_1 = __importDefault(require("compression"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const socket_io_1 = require("socket.io");
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const logger_1 = require("./utils/logger");
const prisma_1 = require("./utils/prisma");
const redis_1 = require("./utils/redis");
const swagger_1 = require("./swagger");
const errorHandler_1 = require("./middleware/errorHandler");
// Routes
const auth_1 = __importDefault(require("./routes/auth"));
const applications_1 = __importDefault(require("./routes/applications"));
const documents_1 = __importDefault(require("./routes/documents"));
const payments_1 = __importDefault(require("./routes/payments"));
const gist_1 = __importDefault(require("./routes/gist"));
const audit_1 = __importDefault(require("./routes/audit"));
const admin_1 = __importDefault(require("./routes/admin"));
const gis_1 = __importDefault(require("./routes/gis"));
const notifications_1 = __importDefault(require("./routes/notifications"));
exports.app = (0, express_1.default)();
const httpServer = http_1.default.createServer(exports.app);
// ─── Socket.io ───────────────────────────────────────────────────────────────
exports.io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true,
    },
});
exports.io.on('connection', (socket) => {
    logger_1.logger.info(`Socket connected: ${socket.id}`);
    socket.on('join:application', (applicationId) => {
        socket.join(`application:${applicationId}`);
    });
    socket.on('join:user', (userId) => {
        socket.join(`user:${userId}`);
    });
    socket.on('disconnect', () => {
        logger_1.logger.info(`Socket disconnected: ${socket.id}`);
    });
});
// ─── Rate limiting ────────────────────────────────────────────────────────────
const apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'TOO_MANY_REQUESTS', message: 'Too many requests, please try again later.' },
});
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { success: false, error: 'TOO_MANY_REQUESTS', message: 'Too many auth attempts.' },
});
// ─── Middleware ───────────────────────────────────────────────────────────────
exports.app.use((0, helmet_1.default)({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
exports.app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
exports.app.use((0, compression_1.default)());
exports.app.use(express_1.default.json({ limit: '10mb' }));
exports.app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
exports.app.use((0, cookie_parser_1.default)());
exports.app.use((0, morgan_1.default)('combined', {
    stream: { write: (message) => logger_1.logger.http(message.trim()) },
}));
// ─── Swagger Docs ─────────────────────────────────────────────────────────────
const swaggerSpec = (0, swagger_1.setupSwagger)();
exports.app.use('/api/docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerSpec));
// ─── Health Check ─────────────────────────────────────────────────────────────
exports.app.get('/health', (_req, res) => {
    res.json({ success: true, data: { status: 'healthy', timestamp: new Date().toISOString() } });
});
// ─── API Routes ───────────────────────────────────────────────────────────────
exports.app.use('/api/auth', authLimiter, auth_1.default);
exports.app.use('/api/applications', apiLimiter, applications_1.default);
exports.app.use('/api/documents', apiLimiter, documents_1.default);
exports.app.use('/api/payments', apiLimiter, payments_1.default);
exports.app.use('/api/gist', apiLimiter, gist_1.default);
exports.app.use('/api/audit', apiLimiter, audit_1.default);
exports.app.use('/api/admin', apiLimiter, admin_1.default);
exports.app.use('/api/gis', apiLimiter, gis_1.default);
exports.app.use('/api/notifications', apiLimiter, notifications_1.default);
// ─── Static uploads (local storage fallback) ──────────────────────────────────
exports.app.use('/uploads', express_1.default.static('uploads'));
// ─── 404 Handler ──────────────────────────────────────────────────────────────
exports.app.use((_req, res) => {
    res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Route not found' });
});
// ─── Error Handler ────────────────────────────────────────────────────────────
exports.app.use(errorHandler_1.errorHandler);
// ─── Startup ──────────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '3000', 10);
async function start() {
    try {
        await prisma_1.prisma.$connect();
        logger_1.logger.info('✅ PostgreSQL connected');
        await redis_1.redisClient.ping();
        logger_1.logger.info('✅ Redis connected');
        httpServer.listen(PORT, () => {
            logger_1.logger.info(`🚀 CECB Backend running on http://localhost:${PORT}`);
            logger_1.logger.info(`📚 API Docs: http://localhost:${PORT}/api/docs`);
        });
    }
    catch (err) {
        logger_1.logger.error('Failed to start server:', err);
        process.exit(1);
    }
}
// ─── Graceful Shutdown ────────────────────────────────────────────────────────
process.on('SIGTERM', async () => {
    logger_1.logger.info('SIGTERM received — shutting down gracefully');
    httpServer.close(async () => {
        await prisma_1.prisma.$disconnect();
        await redis_1.redisClient.quit();
        process.exit(0);
    });
});
start();
//# sourceMappingURL=server.js.map