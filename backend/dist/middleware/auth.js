"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.requireRole = requireRole;
exports.optionalAuth = optionalAuth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function authenticate(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
        if (!token) {
            res.status(401).json({ success: false, error: 'UNAUTHORIZED', message: 'Access token required' });
            return;
        }
        const secret = process.env.JWT_SECRET;
        if (!secret)
            throw new Error('JWT_SECRET not configured');
        const payload = jsonwebtoken_1.default.verify(token, secret);
        req.user = {
            id: payload.sub,
            email: payload.email,
            role: payload.role,
            name: payload.name,
        };
        next();
    }
    catch (err) {
        if (err instanceof jsonwebtoken_1.default.TokenExpiredError) {
            res.status(401).json({ success: false, error: 'TOKEN_EXPIRED', message: 'Token has expired' });
        }
        else if (err instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            res.status(401).json({ success: false, error: 'INVALID_TOKEN', message: 'Invalid access token' });
        }
        else {
            next(err);
        }
    }
}
function requireRole(roles) {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ success: false, error: 'UNAUTHORIZED', message: 'Authentication required' });
            return;
        }
        if (!roles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                error: 'FORBIDDEN',
                message: `Access restricted to: ${roles.join(', ')}`,
            });
            return;
        }
        next();
    };
}
function optionalAuth(req, _res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
        next();
        return;
    }
    try {
        const secret = process.env.JWT_SECRET;
        const payload = jsonwebtoken_1.default.verify(token, secret);
        req.user = { id: payload.sub, email: payload.email, role: payload.role, name: payload.name };
    }
    catch {
        // ignore — optional
    }
    next();
}
//# sourceMappingURL=auth.js.map