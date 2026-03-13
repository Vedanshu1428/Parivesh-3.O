import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: UserRole;
        name: string;
    };
}
export declare function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void;
export declare function requireRole(roles: UserRole[]): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction): void;
//# sourceMappingURL=auth.d.ts.map