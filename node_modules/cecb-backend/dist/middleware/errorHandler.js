"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
exports.asyncHandler = asyncHandler;
exports.errorHandler = errorHandler;
const zod_1 = require("zod");
const logger_1 = require("../utils/logger");
class AppError extends Error {
    statusCode;
    error;
    constructor(statusCode, error, message) {
        super(message);
        this.statusCode = statusCode;
        this.error = error;
        this.name = 'AppError';
    }
}
exports.AppError = AppError;
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
function errorHandler(err, _req, res, _next) {
    logger_1.logger.error(err.message, { stack: err.stack });
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            success: false,
            error: err.error,
            message: err.message,
        });
        return;
    }
    if (err instanceof zod_1.ZodError) {
        res.status(422).json({
            success: false,
            error: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            details: err.errors.map((e) => ({
                field: e.path.join('.'),
                message: e.message,
            })),
        });
        return;
    }
    // Prisma errors
    if (err.code === 'P2002') {
        res.status(409).json({
            success: false,
            error: 'CONFLICT',
            message: 'A record with this data already exists',
        });
        return;
    }
    if (err.code === 'P2025') {
        res.status(404).json({
            success: false,
            error: 'NOT_FOUND',
            message: 'Record not found',
        });
        return;
    }
    // Generic
    res.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message,
    });
}
//# sourceMappingURL=errorHandler.js.map