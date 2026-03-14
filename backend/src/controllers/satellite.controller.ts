import { Request, Response } from 'express';
import { satelliteService } from '../services/satellite.service';

/**
 * Controller for Satellite/Geospatial Verification
 */
export const satelliteController = {
  /**
   * Run live analysis for provided coordinates (Proponent use-case before submission)
   */
  async analyzeLive(req: Request, res: Response) {
    try {
      const { lat, lng } = req.query;

      if (!lat || !lng) {
        return res.status(400).json({ error: 'Missing lat or lng query parameters.' });
      }

      const report = await satelliteService.analyzeLocation(parseFloat(lat as string), parseFloat(lng as string));
      res.json({ success: true, data: report });
    } catch (error) {
      console.error('[SatelliteController] analyzeLive error:', error);
      res.status(500).json({ error: 'Failed to analyze location' });
    }
  },

  /**
   * Run analysis and save the report for a specific application (Scrutiny use-case)
   */
  async analyzeApplication(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const report = await satelliteService.analyzeApplication(id);
      res.json({ success: true, data: report });
    } catch (error) {
      console.error('[SatelliteController] analyzeApplication error:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  },

  async findIndustrialZones(req: Request, res: Response) {
    try {
      const { lat, lng } = req.query;
      if (!lat || !lng) return res.status(400).json({ error: 'Missing coordinates' });
      
      const zones = await satelliteService.findIndustrialZones(parseFloat(lat as string), parseFloat(lng as string));
      res.json({ success: true, data: zones });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch zones' });
    }
  }
};
