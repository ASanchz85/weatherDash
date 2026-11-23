import type { WeatherConfig } from '../../config/env.js';
import type { ServiceLogger } from '../../shared/service-logger.js';
import type { GeocodedPlace, ResolvedLocation } from './location.types.js';

export class LocationNotFoundError extends Error {
  override readonly name = 'LocationNotFoundError';
}

export interface LocationServiceOptions {
  geocode: (name: string, countryCode: string | null) => Promise<GeocodedPlace | null>;
  config: WeatherConfig;
  logger?: ServiceLogger;
}

export interface LocationService {
  getLocation(): Promise<ResolvedLocation>;
}

/** Resuelve la localidad una sola vez, de forma perezosa, y la comparte entre todos los módulos de datos. */
export function createLocationService({ geocode, config, logger }: LocationServiceOptions): LocationService {
  let resolved: ResolvedLocation | null = null;
  let pending: Promise<ResolvedLocation> | null = null;

  async function resolve(): Promise<ResolvedLocation> {
    if (config.coordinates) {
      return {
        name: config.locationName,
        country: config.country,
        ...config.coordinates,
        timezone: config.timezone,
      };
    }

    const candidates = [config.locationName, config.fallbackLocationName].filter(
      (name): name is string => name !== null,
    );

    for (const name of candidates) {
      const place = await geocode(name, config.countryCode);
      if (place) {
        return {
          name: place.name,
          country: place.country ?? config.country,
          latitude: place.latitude,
          longitude: place.longitude,
          timezone: config.timezone ?? place.timezone,
        };
      }
      logger?.warn({ location: name }, 'Localidad no encontrada mediante geocoding');
    }

    throw new LocationNotFoundError(`No se encontró ninguna localidad: ${candidates.join(', ')}`);
  }

  return {
    async getLocation() {
      if (resolved) return resolved;

      // Varios módulos pueden pedir la localidad a la vez al arrancar: comparten un único geocoding.
      pending ??= resolve()
        .then((location) => {
          resolved = location;
          return location;
        })
        .finally(() => {
          pending = null;
        });
      return pending;
    },
  };
}
