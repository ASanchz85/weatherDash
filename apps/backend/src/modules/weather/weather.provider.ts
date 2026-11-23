import type { z } from 'zod';

import { interpretWeatherCode } from './weather.codes.js';
import {
  forecastResponseSchema,
  geocodingResponseSchema,
  type ForecastResponse,
} from './weather.schema.js';
import type { DailyForecast, ResolvedLocation, WeatherSnapshot } from './weather.types.js';

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const GEOCODING_LANGUAGE = 'es';
const GEOCODING_MAX_RESULTS = 1;
const FORECAST_DAYS = 7;
const AUTO_TIMEZONE = 'auto';

const CURRENT_FIELDS = [
  'temperature_2m',
  'apparent_temperature',
  'relative_humidity_2m',
  'wind_speed_10m',
  'weather_code',
  'is_day',
  'precipitation_probability',
] as const;

const DAILY_FIELDS = [
  'weather_code',
  'temperature_2m_max',
  'temperature_2m_min',
  'precipitation_probability_max',
] as const;

export class WeatherProviderError extends Error {
  override readonly name = 'WeatherProviderError';
}

export interface GeocodedPlace {
  name: string;
  country: string | null;
  latitude: number;
  longitude: number;
  timezone: string | null;
}

/** Contrato del proveedor meteorológico; el resto de la aplicación no conoce Open-Meteo. */
export interface WeatherProvider {
  geocode(name: string, countryCode: string | null): Promise<GeocodedPlace | null>;
  fetchForecast(location: ResolvedLocation): Promise<WeatherSnapshot>;
}

export interface OpenMeteoProviderOptions {
  requestTimeoutMs: number;
  fetchFn?: typeof fetch;
}

export function createOpenMeteoProvider({
  requestTimeoutMs,
  fetchFn = fetch,
}: OpenMeteoProviderOptions): WeatherProvider {
  async function fetchValidated<Schema extends z.ZodType>(
    url: URL,
    schema: Schema,
  ): Promise<z.infer<Schema>> {
    let response: Response;
    try {
      response = await fetchFn(url, { signal: AbortSignal.timeout(requestTimeoutMs) });
    } catch (error) {
      const reason =
        error instanceof Error && error.name === 'TimeoutError'
          ? `timeout tras ${requestTimeoutMs} ms`
          : 'error de red';
      throw new WeatherProviderError(`Open-Meteo no responde (${reason})`, { cause: error });
    }

    if (!response.ok) {
      throw new WeatherProviderError(`Open-Meteo respondió con estado HTTP ${response.status}`);
    }

    let body: unknown;
    try {
      body = await response.json();
    } catch (error) {
      throw new WeatherProviderError('Open-Meteo devolvió una respuesta que no es JSON', {
        cause: error,
      });
    }

    const result = schema.safeParse(body);
    if (!result.success) {
      throw new WeatherProviderError('Open-Meteo devolvió datos con un formato inesperado', {
        cause: result.error,
      });
    }
    return result.data;
  }

  return {
    async geocode(name, countryCode) {
      const url = new URL(GEOCODING_URL);
      url.searchParams.set('name', name);
      url.searchParams.set('count', String(GEOCODING_MAX_RESULTS));
      url.searchParams.set('language', GEOCODING_LANGUAGE);
      if (countryCode) url.searchParams.set('countryCode', countryCode);

      const data = await fetchValidated(url, geocodingResponseSchema);
      const place = data.results?.[0];
      if (!place) return null;

      return {
        name: place.name,
        country: place.country ?? null,
        latitude: place.latitude,
        longitude: place.longitude,
        timezone: place.timezone ?? null,
      };
    },

    async fetchForecast(location) {
      const url = new URL(FORECAST_URL);
      url.searchParams.set('latitude', String(location.latitude));
      url.searchParams.set('longitude', String(location.longitude));
      url.searchParams.set('current', CURRENT_FIELDS.join(','));
      url.searchParams.set('daily', DAILY_FIELDS.join(','));
      url.searchParams.set('forecast_days', String(FORECAST_DAYS));
      url.searchParams.set('timezone', location.timezone ?? AUTO_TIMEZONE);
      url.searchParams.set('wind_speed_unit', 'kmh');
      url.searchParams.set('temperature_unit', 'celsius');

      const data = await fetchValidated(url, forecastResponseSchema);
      return normalizeForecast(data, location);
    },
  };
}

/** Transforma la respuesta de Open-Meteo al modelo interno de la aplicación. */
export function normalizeForecast(data: ForecastResponse, location: ResolvedLocation): WeatherSnapshot {
  const { current, daily } = data;
  const condition = interpretWeatherCode(current.weather_code);

  return {
    location: { name: location.name, country: location.country },
    current: {
      temperature: current.temperature_2m,
      apparentTemperature: current.apparent_temperature,
      relativeHumidity: current.relative_humidity_2m,
      windSpeed: current.wind_speed_10m,
      precipitationProbability: current.precipitation_probability ?? null,
      weatherCode: current.weather_code,
      description: condition.description,
      icon: condition.icon,
      isDay: current.is_day === 1,
    },
    daily: {
      temperatureMax: daily.temperature_2m_max[0] ?? null,
      temperatureMin: daily.temperature_2m_min[0] ?? null,
    },
    forecast: normalizeDailyForecast(daily),
  };
}

function normalizeDailyForecast(daily: ForecastResponse['daily']): DailyForecast[] {
  return daily.time.flatMap((date, index) => {
    const weatherCode = daily.weather_code[index];
    if (weatherCode === undefined) return [];
    const condition = interpretWeatherCode(weatherCode);

    return {
      date,
      weatherCode,
      description: condition.description,
      icon: condition.icon,
      temperatureMax: daily.temperature_2m_max[index] ?? null,
      temperatureMin: daily.temperature_2m_min[index] ?? null,
      precipitationProbabilityMax: daily.precipitation_probability_max[index] ?? null,
    };
  });
}
