export interface SatelliteReport {
    coordinates: {
        lat: number;
        lng: number;
    };
    radiusMeters: number;
    hasForest: boolean;
    hasWaterBody: boolean;
    forestAreas: Array<{
        lat: number;
        lng: number;
        type: string;
    }>;
    waterAreas: Array<{
        lat: number;
        lng: number;
        type: string;
    }>;
    riskScore: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    findings: string[];
}
export declare class SatelliteService {
    /**
     * Queries OpenStreetMap to find environmental features near a location
     */
    analyzeLocation(lat: number, lng: number, radius?: number): Promise<SatelliteReport>;
    /**
     * Analyzes an application and saves the report to the database
     */
    analyzeApplication(applicationId: string): Promise<SatelliteReport>;
}
export declare const satelliteService: SatelliteService;
//# sourceMappingURL=satellite.service.d.ts.map