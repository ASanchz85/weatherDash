import type { WeatherConfig } from '../../config/env.js';
import type { WeatherProvider } from './weather.provider.js';
import type { ResolvedLocation, WeatherReport, WeatherSnapshot } from './weather.types.js';

/** Tiempo mínimo entre reintentos al proveedor tras un fallo, para no saturarlo ni retrasar respuestas. */
export const RETRY_AFTER_FAILURE_MS = 60 * 1000;

export class WeatherUnavailableError extends Error {
  override readonly name = 'WeatherUnavailableError';
}

export class LocationNotFoundError extends Error {
  override readonly name = 'LocationNotFoundError';
}

export interface WeatherServiceLogger {
  warn(details: object, message: string): void;
}

export interface WeatherServiceOptions {
  provider: WeatherProvider;
  config: WeatherConfig;
  logger?: WeatherServiceLogger;
  now?: () => number;
}

export interface WeatherService {
  getWeather(): Promise<WeatherReport>;
}

interface CacheEntry {
  snapshot: WeatherSnapshot;
  fetchedAt: number;
}

export function createWeatherService({
  provider,
  config,
  logger,
  now = Date.now,
}: WeatherServiceOptions): WeatherService {
  let cache: CacheEntry | null = null;
  let pendingRefresh: Promise<CacheEntry> | null = null;
  let lastFailureAt: number | null = null;
  let resolvedLocation: ResolvedLocation | null = null;

  async function resolveLocation(): Promise<ResolvedLocation> {
    if (resolvedLocation) return resolvedLocation;

    if (config.coordinates) {
      resolvedLocation = {
        name: config.locationName,
        country: config.country,
        ...config.coordinates,
        timezone: config.timezone,
      };
      return resolvedLocation;
    }

    const candidates = [config.locationName, config.fallbackLocationName].filter(
      (name): name is string => name !== null,
    );

    for (const name of candidates) {
      const place = await provider.geocode(name, config.countryCode);
      if (place) {
        resolvedLocation = {
          name: place.name,
          country: place.country ?? config.country,
          latitude: place.latitude,
          longitude: place.longitude,
          timezone: config.timezone ?? place.timezone,
        };
        return resolvedLocation;
      }
      logger?.warn({ location: name }, 'Localidad no encontrada mediante geocoding');
    }

    throw new LocationNotFoundError(`No se encontró ninguna localidad: ${candidates.join(', ')}`);
  }

  async function refresh(): Promise<CacheEntry> {
    const location = await resolveLocation();
    const snapshot = await provider.fetchForecast(location);
    const entry = { snapshot, fetchedAt: now() };
    cache = entry;
    lastFailureAt = null;
    return entry;
  }

  /** Comparte una única petición en curso entre todos los clientes que la soliciten a la vez. */
  function refreshOnce(): Promise<CacheEntry> {
    pendingRefresh ??= refresh().finally(() => {
      pendingRefresh = null;
    });
    return pendingRefresh;
  }

  function isFresh(entry: CacheEntry): boolean {
    return now() - entry.fetchedAt < config.refreshIntervalMs;
  }

  function isCoolingDown(): boolean {
    return lastFailureAt !== null && now() - lastFailureAt < RETRY_AFTER_FAILURE_MS;
  }

  function toReport(entry: CacheEntry, stale: boolean): WeatherReport {
    return { ...entry.snapshot, updatedAt: new Date(entry.fetchedAt).toISOString(), stale };
  }

  return {
    async getWeather() {
      if (cache && isFresh(cache)) return toReport(cache, false);
      if (cache && isCoolingDown()) return toReport(cache, true);

      try {
        return toReport(await refreshOnce(), false);
      } catch (error) {
        lastFailureAt = now();
        logger?.warn({ err: error }, 'No se pudo actualizar la información meteorológica');
        if (cache) return toReport(cache, true);
        throw new WeatherUnavailableError('La información meteorológica no está disponible', {
          cause: error,
        });
      }
    },
  };
}
