"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.satelliteController = void 0;
const satellite_service_1 = require("../services/satellite.service");
/**
 * Controller for Satellite/Geospatial Verification
 */
exports.satelliteController = {
    /**
     * Run live analysis for provided coordinates (Proponent use-case before submission)
     */
    async analyzeLive(req, res) {
        try {
            const { lat, lng } = req.query;
            if (!lat || !lng) {
                return res.status(400).json({ error: 'Missing lat or lng query parameters.' });
            }
            const report = await satellite_service_1.satelliteService.analyzeLocation(parseFloat(lat), parseFloat(lng));
            res.json({ success: true, data: report });
        }
        catch (error) {
            console.error('[SatelliteController] analyzeLive error:', error);
            res.status(500).json({ error: 'Failed to analyze location' });
        }
    },
    /**
     * Run analysis and save the report for a specific application (Scrutiny use-case)
     */
    async analyzeApplication(req, res) {
        try {
            const { id } = req.params;
            const report = await satellite_service_1.satelliteService.analyzeApplication(id);
            res.json({ success: true, data: report });
        }
        catch (error) {
            console.error('[SatelliteController] analyzeApplication error:', error);
            res.status(500).json({ error: error.message });
        }
    }
};
//# sourceMappingURL=satellite.controller.js.map