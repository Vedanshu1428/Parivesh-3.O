import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Overpass API URL - Using the main public instance (rate limited, suitable for hackathon)
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

export interface SatelliteReport {
  coordinates: { lat: number; lng: number };
  radiusMeters: number;
  hasForest: boolean;
  hasWaterBody: boolean;
  forestAreas: Array<{ lat: number; lng: number; type: string }>;
  waterAreas: Array<{ lat: number; lng: number; type: string }>;
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  findings: string[];
}

export class SatelliteService {
  /**
   * Queries OpenStreetMap to find environmental features near a location
   */
  async analyzeLocation(lat: number, lng: number, radius = 5000): Promise<SatelliteReport> {
    console.log(`[SatelliteService] Analyzing location ${lat}, ${lng} within ${radius}m`);

    // Overpass QL to find forests and water bodies within radius
    const query = `
      [out:json][timeout:25];
      (
        // Forests / Woods
        node["natural"="wood"](around:${radius},${lat},${lng});
        way["natural"="wood"](around:${radius},${lat},${lng});
        way["landuse"="forest"](around:${radius},${lat},${lng});
        
        // Water bodies
        node["natural"="water"](around:${radius},${lat},${lng});
        way["natural"="water"](around:${radius},${lat},${lng});
        way["waterway"="river"](around:${radius},${lat},${lng});
      );
      out center;
    `;

    try {
      const response = await axios.post(OVERPASS_URL, query, {
        headers: { 'Content-Type': 'text/plain' },
        timeout: 10000
      });

      const elements = response.data.elements || [];
      
      const forestAreas: any[] = [];
      const waterAreas: any[] = [];

      elements.forEach((el: any) => {
        const itemLat = el.lat || (el.center && el.center.lat);
        const itemLng = el.lon || (el.center && el.center.lon);
        
        if (!itemLat || !itemLng) return;

        const tags = el.tags || {};
        const isForest = tags.natural === 'wood' || tags.landuse === 'forest';
        const isWater = tags.natural === 'water' || !!tags.waterway;

        if (isForest) {
          forestAreas.push({ lat: itemLat, lng: itemLng, type: tags.natural || tags.landuse });
        } else if (isWater) {
          waterAreas.push({ lat: itemLat, lng: itemLng, type: tags.natural || tags.waterway });
        }
      });

      // Simple scoring logic for the hackathon
      let riskScore = 1; // Base score
      const findings: string[] = [];

      if (forestAreas.length > 0) {
        riskScore += 4;
        findings.push(`Forest area detected within ${radius / 1000}km.`);
      }

      if (waterAreas.length > 0) {
        riskScore += 3;
        findings.push(`Water body/river detected within ${radius / 1000}km.`);
      }

      const riskLevel = riskScore >= 7 ? 'HIGH' : riskScore >= 4 ? 'MEDIUM' : 'LOW';

      return {
        coordinates: { lat, lng },
        radiusMeters: radius,
        hasForest: forestAreas.length > 0,
        hasWaterBody: waterAreas.length > 0,
        forestAreas,
        waterAreas,
        riskScore,
        riskLevel,
        findings
      };
    } catch (error) {
      console.error('[SatelliteService] Error querying Overpass API:', error);
      throw new Error('Failed to analyze satellite/geospatial data');
    }
  }

  /**
   * Analyzes an application and saves the report to the database
   */
  async analyzeApplication(applicationId: string): Promise<SatelliteReport> {
    const app = await prisma.application.findUnique({
      where: { id: applicationId }
    });

    if (!app) throw new Error('Application not found');
    if (!app.lat || !app.lng) throw new Error('Application does not have coordinates set');

    const report = await this.analyzeLocation(app.lat, app.lng);

    // Update the application with the results
    await prisma.application.update({
      where: { id: applicationId },
      data: {
        satelliteRiskScore: report.riskScore,
        satelliteReport: report as any // Store the JSON report
      }
    });

    return report;
  }
}

export const satelliteService = new SatelliteService();
