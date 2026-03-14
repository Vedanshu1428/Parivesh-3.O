import { Request, Response } from 'express';
/**
 * Controller for Satellite/Geospatial Verification
 */
export declare const satelliteController: {
    /**
     * Run live analysis for provided coordinates (Proponent use-case before submission)
     */
    analyzeLive(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Run analysis and save the report for a specific application (Scrutiny use-case)
     */
    analyzeApplication(req: Request, res: Response): Promise<void>;
};
//# sourceMappingURL=satellite.controller.d.ts.map