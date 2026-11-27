import Fastify, { type FastifyInstance, type FastifyServerOptions } from 'fastify';

import type { NewsConfig, UiConfig, WeatherConfig } from './config/env.js';
import type { AirQualityProvider } from './modules/air-quality/air-quality.provider.js';
import { airQualityRoutes } from './modules/air-quality/air-quality.routes.js';
import { createAirQualityService } from './modules/air-quality/air-quality.service.js';
import type { AirQualitySnapshot } from './modules/air-quality/air-quality.types.js';
import { healthRoutes } from './modules/health/health.routes.js';
import { createLocationService } from './modules/location/location.service.js';
import { startDailyRefresh } from './modules/news/news.daily-refresh.js';
import type { NewsRepository } from './modules/news/news.repository.js';
import { newsRoutes } from './modules/news/news.routes.js';
import { createNewsService } from './modules/news/news.service.js';
import type { NewsFeed, NewsProvider } from './modules/news/news.types.js';
import { uiRoutes } from './modules/ui/ui.routes.js';
import type { WeatherProvider } from './modules/weather/weather.provider.js';
import { weatherRoutes } from './modules/weather/weather.routes.js';
import { createWeatherService } from './modules/weather/weather.service.js';
import type { WeatherSnapshot } from './modules/weather/weather.types.js';
import { staticFrontend } from './plugins/static.js';
import type { SnapshotStorage } from './shared/snapshot-store.js';

export const NEWS_DEFAULT_TIME_ZONE = 'Europe/Madrid';

export interface NewsOptions {
  config: NewsConfig;
  providers: Record<NewsFeed, NewsProvider>;
  repository: NewsRepository;
  /** Consulta los feeds al arrancar y después cada `config.refreshIntervalMs`. */
  autoRefresh?: boolean;
}

export interface BuildAppOptions {
  weatherConfig: WeatherConfig;
  uiConfig: UiConfig;
  weatherProvider: WeatherProvider;
  airQualityProvider: AirQualityProvider;
  /** Sin esta opción el módulo de noticias queda desactivado. */
  news?: NewsOptions;
  /** Persistencia de la última información obtenida; sin ella, los datos solo viven en memoria. */
  snapshotStorage?: SnapshotStorage;
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
  news,
  snapshotStorage,
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
    store: snapshotStorage?.storeFor<WeatherSnapshot>('weather'),
    logger: app.log,
    ...clock,
  });
  const airQualityService = createAirQualityService({
    provider: airQualityProvider,
    locationService,
    refreshIntervalMs: weatherConfig.refreshIntervalMs,
    store: snapshotStorage?.storeFor<AirQualitySnapshot>('air-quality'),
    logger: app.log,
    ...clock,
  });

  await app.register(healthRoutes);
  await app.register(uiRoutes, { uiConfig });
  await app.register(weatherRoutes, { weatherService });
  await app.register(airQualityRoutes, { airQualityService });

  if (news) {
    const newsService = createNewsService({
      providers: news.providers,
      repository: news.repository,
      feedUrls: news.config.feedUrls,
      rotationSize: news.config.rotationSize,
      timeZone: weatherConfig.timezone ?? NEWS_DEFAULT_TIME_ZONE,
      logger: app.log,
      ...clock,
    });
    await app.register(newsRoutes, { newsService });

    if (news.autoRefresh) {
      let timer: NodeJS.Timeout | undefined;
      let stopDailyRefresh: (() => void) | undefined;
      app.addHook('onReady', async () => {
        // Los fallos ya los registra el servicio; el servidor arranca igualmente.
        const refresh = () => void newsService.refresh().catch(() => undefined);
        refresh();
        timer = setInterval(refresh, news.config.refreshIntervalMs);
        timer.unref();
        // Las efemérides cambian a medianoche: se renuevan a las 00:01 sin esperar al refresco periódico.
        stopDailyRefresh = startDailyRefresh({
          refresh: () => newsService.refreshDaily(),
          timeZone: weatherConfig.timezone ?? NEWS_DEFAULT_TIME_ZONE,
          ...clock,
        });
      });
      app.addHook('onClose', async () => {
        clearInterval(timer);
        stopDailyRefresh?.();
      });
    }
  }
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
