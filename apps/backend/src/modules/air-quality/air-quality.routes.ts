import type { FastifyPluginAsync } from 'fastify';

import { AirQualityUnavailableError, type AirQualityService } from './air-quality.service.js';

const SERVICE_UNAVAILABLE = 503;

export interface AirQualityRoutesOptions {
  airQualityService: AirQualityService;
}

export const airQualityRoutes: FastifyPluginAsync<AirQualityRoutesOptions> = async (
  app,
  { airQualityService },
) => {
  app.get('/api/air-quality', async (_request, reply) => {
    reply.header('Cache-Control', 'no-store');
    try {
      return await airQualityService.getAirQuality();
    } catch (error) {
      if (error instanceof AirQualityUnavailableError) {
        return reply.code(SERVICE_UNAVAILABLE).send({
          error: 'AIR_QUALITY_UNAVAILABLE',
          message: error.message,
        });
      }
      throw error;
    }
  });
};
