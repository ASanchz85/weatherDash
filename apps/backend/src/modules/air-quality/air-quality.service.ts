import { createCachedResource } from '../../shared/cached-resource.js';
import type { ServiceLogger } from '../../shared/service-logger.js';
import type { SnapshotStore } from '../../shared/snapshot-store.js';
import type { LocationService } from '../location/location.service.js';
import type { AirQualityProvider } from './air-quality.provider.js';
import type { AirQualityReport, AirQualitySnapshot } from './air-quality.types.js';

/** La fuente (CAMS) se actualiza como mucho cada hora, así que no tiene sentido consultarla más a menudo. */
export const AIR_QUALITY_MIN_TTL_MS = 60 * 60 * 1000;

export class AirQualityUnavailableError extends Error {
  override readonly name = 'AirQualityUnavailableError';
}

export interface AirQualityServiceOptions {
  provider: AirQualityProvider;
  locationService: LocationService;
  /** Intervalo de actualización general (WEATHER_REFRESH_INTERVAL); la caché dura al menos una hora. */
  refreshIntervalMs: number;
  /** Conserva la última información entre reinicios del servidor. */
  store?: SnapshotStore<AirQualitySnapshot> | undefined;
  logger?: ServiceLogger;
  now?: () => number;
}

export interface AirQualityService {
  getAirQuality(): Promise<AirQualityReport>;
}

export function createAirQualityService({
  provider,
  locationService,
  refreshIntervalMs,
  store,
  logger,
  now = Date.now,
}: AirQualityServiceOptions): AirQualityService {
  const snapshot = createCachedResource({
    load: async () => provider.fetchAirQuality(await locationService.getLocation()),
    ttlMs: Math.max(refreshIntervalMs, AIR_QUALITY_MIN_TTL_MS),
    now,
    onFailure: (error) => logger?.warn({ err: error }, 'No se pudo actualizar la calidad del aire'),
    store,
    onStoreFailure: (error) =>
      logger?.warn({ err: error }, 'No se pudo leer o guardar la calidad del aire persistida'),
  });

  return {
    async getAirQuality() {
      try {
        const { value, fetchedAt, stale } = await snapshot.get();
        return { ...value, updatedAt: new Date(fetchedAt).toISOString(), stale };
      } catch (error) {
        throw new AirQualityUnavailableError('La calidad del aire no está disponible', { cause: error });
      }
    },
  };
}
