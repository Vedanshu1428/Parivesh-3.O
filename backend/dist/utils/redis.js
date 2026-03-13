"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisClient = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const logger_1 = require("./logger");
exports.redisClient = new ioredis_1.default(process.env.REDIS_URL || 'redis://localhost:6379', {
    lazyConnect: true,
    retryStrategy: (times) => {
        if (times > 3) {
            logger_1.logger.warn('Redis not available — running without Redis');
            return null;
        }
        return Math.min(times * 200, 3000);
    },
});
exports.redisClient.on('error', (err) => {
    logger_1.logger.warn(`Redis error: ${err.message}`);
});
exports.default = exports.redisClient;
//# sourceMappingURL=redis.js.map