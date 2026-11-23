import type { WeatherConfig } from '../config/env.js';
import type { ForecastResponse } from '../modules/weather/weather.schema.js';
import type { ResolvedLocation, WeatherSnapshot } from '../modules/weather/weather.types.js';

export const weatherConfig: WeatherConfig = {
  locationName: 'Navaluenga',
  fallbackLocationName: 'Ávila',
  country: 'España',
  countryCode: 'ES',
  coordinates: null,
  timezone: 'Europe/Madrid',
  refreshIntervalMs: 15 * 60 * 1000,
  requestTimeoutMs: 1000,
};

export const navaluenga: ResolvedLocation = {
  name: 'Navaluenga',
  country: 'España',
  latitude: 40.41123,
  longitude: -4.70897,
  timezone: 'Europe/Madrid',
};

export const forecastResponse: ForecastResponse = {
  current: {
    temperature_2m: 8.4,
    apparent_temperature: 6.1,
    relative_humidity_2m: 72,
    wind_speed_10m: 2.3,
    weather_code: 2,
    is_day: 1,
    precipitation_probability: 10,
  },
  daily: {
    temperature_2m_max: [11.9],
    temperature_2m_min: [0.8],
  },
};

export const geocodingResponse = {
  results: [
    {
      name: 'Navaluenga',
      latitude: 40.41123,
      longitude: -4.70897,
      country: 'España',
      timezone: 'Europe/Madrid',
    },
  ],
};

export function buildSnapshot(temperature = 8.4): WeatherSnapshot {
  return {
    location: { name: 'Navaluenga', country: 'España' },
    current: {
      temperature,
      apparentTemperature: 6.1,
      relativeHumidity: 72,
      windSpeed: 2.3,
      precipitationProbability: 10,
      weatherCode: 2,
      description: 'Parcialmente nuboso',
      icon: 'partly-cloudy',
      isDay: true,
    },
    daily: { temperatureMax: 11.9, temperatureMin: 0.8 },
  };
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
