import type { WeatherConfig } from '../../config/env.js';
import { createCachedResource } from '../../shared/cached-resource.js';
import type { ServiceLogger } from '../../shared/service-logger.js';
import type { SnapshotStore } from '../../shared/snapshot-store.js';
import type { LocationService } from '../location/location.service.js';
import type { WeatherProvider } from './weather.provider.js';
import type { WeatherReport, WeatherSnapshot } from './weather.types.js';

export { RETRY_AFTER_FAILURE_MS } from '../../shared/cached-resource.js';

export class WeatherUnavailableError extends Error {
  override readonly name = 'WeatherUnavailableError';
}

export interface WeatherServiceOptions {
  provider: WeatherProvider;
  locationService: LocationService;
  config: WeatherConfig;
  /** Conserva la última información entre reinicios del servidor. */
  store?: SnapshotStore<WeatherSnapshot> | undefined;
  logger?: ServiceLogger;
  now?: () => number;
}

export interface WeatherService {
  getWeather(): Promise<WeatherReport>;
}

export function createWeatherService({
  provider,
  locationService,
  config,
  store,
  logger,
  now = Date.now,
}: WeatherServiceOptions): WeatherService {
  const snapshot = createCachedResource({
    load: async () => provider.fetchForecast(await locationService.getLocation()),
    ttlMs: config.refreshIntervalMs,
    now,
    onFailure: (error) => logger?.warn({ err: error }, 'No se pudo actualizar la información meteorológica'),
    store,
    onStoreFailure: (error) =>
      logger?.warn({ err: error }, 'No se pudo leer o guardar la información meteorológica persistida'),
  });

  return {
    async getWeather() {
      try {
        const { value, fetchedAt, stale, nextRefreshInMs } = await snapshot.get();
        return { ...value, updatedAt: new Date(fetchedAt).toISOString(), stale, nextRefreshInMs };
      } catch (error) {
        throw new WeatherUnavailableError('La información meteorológica no está disponible', {
          cause: error,
        });
      }
    },
  };
}
