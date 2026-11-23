import type { FastifyPluginAsync } from 'fastify';

import { WeatherUnavailableError, type WeatherService } from './weather.service.js';

const SERVICE_UNAVAILABLE = 503;

export interface WeatherRoutesOptions {
  weatherService: WeatherService;
}

export const weatherRoutes: FastifyPluginAsync<WeatherRoutesOptions> = async (
  app,
  { weatherService },
) => {
  app.get('/api/weather', async (_request, reply) => {
    reply.header('Cache-Control', 'no-store');
    try {
      return await weatherService.getWeather();
    } catch (error) {
      if (error instanceof WeatherUnavailableError) {
        return reply.code(SERVICE_UNAVAILABLE).send({
          error: 'WEATHER_UNAVAILABLE',
          message: error.message,
        });
      }
      throw error;
    }
  });
};
