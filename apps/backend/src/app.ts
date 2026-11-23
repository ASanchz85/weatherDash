import Fastify, { type FastifyInstance, type FastifyServerOptions } from 'fastify';

import type { UiConfig, WeatherConfig } from './config/env.js';
import type { AirQualityProvider } from './modules/air-quality/air-quality.provider.js';
import { airQualityRoutes } from './modules/air-quality/air-quality.routes.js';
import { createAirQualityService } from './modules/air-quality/air-quality.service.js';
import { healthRoutes } from './modules/health/health.routes.js';
import { createLocationService } from './modules/location/location.service.js';
import { uiRoutes } from './modules/ui/ui.routes.js';
import type { WeatherProvider } from './modules/weather/weather.provider.js';
import { weatherRoutes } from './modules/weather/weather.routes.js';
import { createWeatherService } from './modules/weather/weather.service.js';
import { staticFrontend } from './plugins/static.js';

export interface BuildAppOptions {
  weatherConfig: WeatherConfig;
  uiConfig: UiConfig;
  weatherProvider: WeatherProvider;
  airQualityProvider: AirQualityProvider;
  /** Directorio del frontend compilado; null para no servir estáticos (desarrollo y tests). */
  staticDir: string | null;
  /** Lanza la primera consulta de datos al arrancar, sin bloquear el arranque. */
  prefetchWeather?: boolean;
  logger?: FastifyServerOptions['logger'];
  now?: () => number;
}

export async function buildApp({
  weatherConfig,
  uiConfig,
  weatherProvider,
  airQualityProvider,
  staticDir,
  prefetchWeather = false,
  logger = false,
  now,
}: BuildAppOptions): Promise<FastifyInstance> {
  const app = Fastify({ logger });
  const clock = now ? { now } : {};

  const locationService = createLocationService({
    geocode: (name, countryCode) => weatherProvider.geocode(name, countryCode),
    config: weatherConfig,
    logger: app.log,
  });
  const weatherService = createWeatherService({
    config: weatherConfig,
    provider: weatherProvider,
    locationService,
    logger: app.log,
    ...clock,
  });
  const airQualityService = createAirQualityService({
    provider: airQualityProvider,
    locationService,
    refreshIntervalMs: weatherConfig.refreshIntervalMs,
    logger: app.log,
    ...clock,
  });

  await app.register(healthRoutes);
  await app.register(uiRoutes, { uiConfig });
  await app.register(weatherRoutes, { weatherService });
  await app.register(airQualityRoutes, { airQualityService });
  if (staticDir) await app.register(staticFrontend, { root: staticDir });

  if (prefetchWeather) {
    app.addHook('onReady', async () => {
      // Los fallos ya quedan registrados por los servicios; el servidor arranca igualmente.
      weatherService.getWeather().catch(() => undefined);
      airQualityService.getAirQuality().catch(() => undefined);
    });
  }

  return app;
}
