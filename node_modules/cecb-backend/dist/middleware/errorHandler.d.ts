import { Request, Response, NextFunction } from 'express';
export declare class AppError extends Error {
    statusCode: number;
    error: string;
    constructor(statusCode: number, error: string, message: string);
}
export declare function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): (req: Request, res: Response, next: NextFunction) => void;
export declare function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void;
//# sourceMappingURL=errorHandler.d.ts.map