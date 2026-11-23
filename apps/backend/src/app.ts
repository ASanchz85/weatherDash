import Fastify, { type FastifyInstance, type FastifyServerOptions } from 'fastify';

import type { UiConfig, WeatherConfig } from './config/env.js';
import { healthRoutes } from './modules/health/health.routes.js';
import { uiRoutes } from './modules/ui/ui.routes.js';
import type { WeatherProvider } from './modules/weather/weather.provider.js';
import { weatherRoutes } from './modules/weather/weather.routes.js';
import { createWeatherService } from './modules/weather/weather.service.js';
import { staticFrontend } from './plugins/static.js';

export interface BuildAppOptions {
  weatherConfig: WeatherConfig;
  uiConfig: UiConfig;
  weatherProvider: WeatherProvider;
  /** Directorio del frontend compilado; null para no servir estáticos (desarrollo y tests). */
  staticDir: string | null;
  /** Lanza la primera consulta meteorológica al arrancar, sin bloquear el arranque. */
  prefetchWeather?: boolean;
  logger?: FastifyServerOptions['logger'];
  now?: () => number;
}

export async function buildApp({
  weatherConfig,
  uiConfig,
  weatherProvider,
  staticDir,
  prefetchWeather = false,
  logger = false,
  now,
}: BuildAppOptions): Promise<FastifyInstance> {
  const app = Fastify({ logger });

  const weatherService = createWeatherService({
    config: weatherConfig,
    provider: weatherProvider,
    logger: app.log,
    ...(now ? { now } : {}),
  });

  await app.register(healthRoutes);
  await app.register(uiRoutes, { uiConfig });
  await app.register(weatherRoutes, { weatherService });
  if (staticDir) await app.register(staticFrontend, { root: staticDir });

  if (prefetchWeather) {
    app.addHook('onReady', async () => {
      // Los fallos ya quedan registrados por el servicio; el servidor arranca igualmente.
      weatherService.getWeather().catch(() => undefined);
    });
  }

  return app;
}
