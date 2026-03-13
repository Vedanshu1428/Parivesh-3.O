"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("./logger");
exports.prisma = global.__prisma ||
    new client_1.PrismaClient({
        log: [
            { level: 'query', emit: 'event' },
            { level: 'error', emit: 'stdout' },
            { level: 'warn', emit: 'stdout' },
        ],
    });
if (process.env.NODE_ENV !== 'production') {
    global.__prisma = exports.prisma;
}
// @ts-ignore - Prisma types for $on require precise PrismaClient generic instantiation
exports.prisma.$on('query', (e) => {
    if (process.env.NODE_ENV === 'development') {
        logger_1.logger.debug(`Query: ${e.query} | Params: ${e.params} | Duration: ${e.duration}ms`);
    }
});
exports.default = exports.prisma;
//# sourceMappingURL=prisma.js.map