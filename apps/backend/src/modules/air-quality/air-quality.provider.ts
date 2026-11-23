import type { ResolvedLocation } from '../location/location.types.js';
import { createOpenMeteoClient } from '../open-meteo/open-meteo.client.js';
import { airQualityResponseSchema, type AirQualityResponse } from './air-quality.schema.js';
import type { AirQualitySnapshot } from './air-quality.types.js';

const AIR_QUALITY_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality';
const AUTO_TIMEZONE = 'auto';

const CURRENT_FIELDS = [
  'european_aqi',
  'pm2_5',
  'dust',
  'uv_index',
  'olive_pollen',
  'grass_pollen',
] as const;

/** Contrato del proveedor de calidad del aire; el resto de la aplicación no conoce Open-Meteo. */
export interface AirQualityProvider {
  fetchAirQuality(location: ResolvedLocation): Promise<AirQualitySnapshot>;
}

export interface OpenMeteoAirQualityProviderOptions {
  requestTimeoutMs: number;
  fetchFn?: typeof fetch;
}

export function createOpenMeteoAirQualityProvider({
  requestTimeoutMs,
  fetchFn = fetch,
}: OpenMeteoAirQualityProviderOptions): AirQualityProvider {
  const { fetchValidated } = createOpenMeteoClient({ requestTimeoutMs, fetchFn });

  return {
    async fetchAirQuality(location) {
      const url = new URL(AIR_QUALITY_URL);
      url.searchParams.set('latitude', String(location.latitude));
      url.searchParams.set('longitude', String(location.longitude));
      url.searchParams.set('current', CURRENT_FIELDS.join(','));
      url.searchParams.set('timezone', location.timezone ?? AUTO_TIMEZONE);

      return normalizeAirQuality(await fetchValidated(url, airQualityResponseSchema));
    },
  };
}

/** Transforma la respuesta de Open-Meteo al modelo interno de la aplicación. */
export function normalizeAirQuality({ current }: AirQualityResponse): AirQualitySnapshot {
  return {
    europeanAqi: current.european_aqi ?? null,
    pm25: current.pm2_5 ?? null,
    dust: current.dust ?? null,
    uvIndex: current.uv_index ?? null,
    pollen: {
      olive: current.olive_pollen ?? null,
      grass: current.grass_pollen ?? null,
    },
  };
}
