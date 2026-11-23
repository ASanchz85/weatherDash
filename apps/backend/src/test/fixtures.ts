import type { WeatherConfig } from '../config/env.js';
import type { AirQualityResponse } from '../modules/air-quality/air-quality.schema.js';
import type { AirQualitySnapshot } from '../modules/air-quality/air-quality.types.js';
import type { ResolvedLocation } from '../modules/location/location.types.js';
import type { ForecastResponse } from '../modules/weather/weather.schema.js';
import type {
  DailyForecast,
  HourlyForecast,
  WeatherSnapshot,
} from '../modules/weather/weather.types.js';

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
    wind_direction_10m: 90,
    wind_gusts_10m: 6.1,
    pressure_msl: 1024.9,
    cloud_cover: 96,
    weather_code: 2,
    is_day: 1,
    precipitation_probability: 10,
  },
  daily: {
    time: ['2026-11-23', '2026-11-24', '2026-11-25'],
    weather_code: [2, 61, 3],
    temperature_2m_max: [11.9, 10.4, 9.6],
    temperature_2m_min: [0.8, 2.6, 4.6],
    precipitation_probability_max: [0, 65, 25],
  },
  hourly: {
    time: ['2026-11-23T18:00', '2026-11-23T19:00', '2026-11-23T20:00'],
    temperature_2m: [9.2, 7.6, 6.3],
    precipitation_probability: [0, 0, 20],
  },
};

export const airQualityResponse: AirQualityResponse = {
  current: {
    european_aqi: 22,
    pm2_5: 3.3,
    dust: 0,
    uv_index: 0,
    olive_pollen: 0,
    grass_pollen: 0,
  },
};

export function buildAirQuality(): AirQualitySnapshot {
  return {
    europeanAqi: 22,
    pm25: 3.3,
    dust: 0,
    uvIndex: 0,
    pollen: { olive: 0, grass: 0 },
  };
}

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
      windDirection: 90,
      windGusts: 6.1,
      pressure: 1024.9,
      cloudCover: 96,
      precipitationProbability: 10,
      weatherCode: 2,
      description: 'Parcialmente nuboso',
      icon: 'partly-cloudy',
      isDay: true,
    },
    daily: { temperatureMax: 11.9, temperatureMin: 0.8 },
    forecast: buildForecast(),
    hourly: buildHourly(),
  };
}

export function buildHourly(): HourlyForecast[] {
  return [
    { time: '2026-11-23T18:00', temperature: 9.2, precipitationProbability: 0 },
    { time: '2026-11-23T19:00', temperature: 7.6, precipitationProbability: 0 },
    { time: '2026-11-23T20:00', temperature: 6.3, precipitationProbability: 20 },
  ];
}

export function buildForecast(): DailyForecast[] {
  return [
    {
      date: '2026-11-23',
      weatherCode: 2,
      description: 'Parcialmente nuboso',
      icon: 'partly-cloudy',
      temperatureMax: 11.9,
      temperatureMin: 0.8,
      precipitationProbabilityMax: 0,
    },
    {
      date: '2026-11-24',
      weatherCode: 61,
      description: 'Lluvia ligera',
      icon: 'rain',
      temperatureMax: 10.4,
      temperatureMin: 2.6,
      precipitationProbabilityMax: 65,
    },
    {
      date: '2026-11-25',
      weatherCode: 3,
      description: 'Cubierto',
      icon: 'cloudy',
      temperatureMax: 9.6,
      temperatureMin: 4.6,
      precipitationProbabilityMax: 25,
    },
  ];
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
