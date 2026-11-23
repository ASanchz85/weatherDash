import type { GeocodedPlace, ResolvedLocation } from '../location/location.types.js';
import { createOpenMeteoClient } from '../open-meteo/open-meteo.client.js';
import { interpretWeatherCode } from './weather.codes.js';
import {
  forecastResponseSchema,
  geocodingResponseSchema,
  type ForecastResponse,
} from './weather.schema.js';
import type { DailyForecast, HourlyForecast, WeatherSnapshot } from './weather.types.js';

export { OpenMeteoError as WeatherProviderError } from '../open-meteo/open-meteo.client.js';

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const GEOCODING_LANGUAGE = 'es';
const GEOCODING_MAX_RESULTS = 1;
const FORECAST_DAYS = 7;
const FORECAST_HOURS = 24;
const AUTO_TIMEZONE = 'auto';

const CURRENT_FIELDS = [
  'temperature_2m',
  'apparent_temperature',
  'relative_humidity_2m',
  'wind_speed_10m',
  'wind_direction_10m',
  'wind_gusts_10m',
  'pressure_msl',
  'cloud_cover',
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

const HOURLY_FIELDS = ['temperature_2m', 'precipitation_probability'] as const;

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
  const { fetchValidated } = createOpenMeteoClient({ requestTimeoutMs, fetchFn });

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
      url.searchParams.set('hourly', HOURLY_FIELDS.join(','));
      url.searchParams.set('forecast_days', String(FORECAST_DAYS));
      url.searchParams.set('forecast_hours', String(FORECAST_HOURS));
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
  const { current, daily, hourly } = data;
  const condition = interpretWeatherCode(current.weather_code);

  return {
    location: { name: location.name, country: location.country },
    current: {
      temperature: current.temperature_2m,
      apparentTemperature: current.apparent_temperature,
      relativeHumidity: current.relative_humidity_2m,
      windSpeed: current.wind_speed_10m,
      windDirection: current.wind_direction_10m ?? null,
      windGusts: current.wind_gusts_10m ?? null,
      pressure: current.pressure_msl ?? null,
      cloudCover: current.cloud_cover ?? null,
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
    hourly: normalizeHourlyForecast(hourly),
  };
}

function normalizeHourlyForecast(hourly: ForecastResponse['hourly']): HourlyForecast[] {
  return hourly.time.map((time, index) => ({
    time,
    temperature: hourly.temperature_2m[index] ?? null,
    precipitationProbability: hourly.precipitation_probability[index] ?? null,
  }));
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
