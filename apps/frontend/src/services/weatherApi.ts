import { WEATHER_ENDPOINT } from '../config';
import type { DailyForecast, HourlyForecast, WeatherData, WeatherIconName } from '../types/weather';

export class WeatherApiError extends Error {
  override readonly name = 'WeatherApiError';
}

const ICON_NAMES: ReadonlySet<string> = new Set<WeatherIconName>([
  'clear',
  'mostly-clear',
  'partly-cloudy',
  'cloudy',
  'fog',
  'drizzle',
  'rain',
  'sleet',
  'snow',
  'showers',
  'thunderstorm',
  'unknown',
]);

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isNullableNumber(value: unknown): value is number | null {
  return value === null || isNumber(value);
}

function isIconName(value: unknown): value is WeatherIconName {
  return typeof value === 'string' && ICON_NAMES.has(value);
}

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const ISO_DATE_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

function parseHourlyForecast(value: unknown): HourlyForecast {
  if (
    !isRecord(value) ||
    typeof value.time !== 'string' ||
    !ISO_DATE_TIME_PATTERN.test(value.time) ||
    !isNullableNumber(value.temperature) ||
    !isNullableNumber(value.precipitationProbability)
  ) {
    throw new WeatherApiError('Predicción horaria con formato inesperado');
  }

  return {
    time: value.time,
    temperature: value.temperature,
    precipitationProbability: value.precipitationProbability,
  };
}

function parseDailyForecast(value: unknown): DailyForecast {
  if (
    !isRecord(value) ||
    typeof value.date !== 'string' ||
    !ISO_DATE_PATTERN.test(value.date) ||
    !isNumber(value.weatherCode) ||
    typeof value.description !== 'string' ||
    !isIconName(value.icon) ||
    !isNullableNumber(value.temperatureMax) ||
    !isNullableNumber(value.temperatureMin) ||
    !isNullableNumber(value.precipitationProbabilityMax)
  ) {
    throw new WeatherApiError('Predicción diaria con formato inesperado');
  }

  return {
    date: value.date,
    weatherCode: value.weatherCode,
    description: value.description,
    icon: value.icon,
    temperatureMax: value.temperatureMax,
    temperatureMin: value.temperatureMin,
    precipitationProbabilityMax: value.precipitationProbabilityMax,
  };
}

/** Valida en tiempo de ejecución la respuesta de la API local antes de usarla en la interfaz. */
export function parseWeatherData(value: unknown): WeatherData {
  if (!isRecord(value)) throw new WeatherApiError('Respuesta meteorológica no válida');
  const { location, current, daily, forecast, hourly, updatedAt, stale, nextRefreshInMs } = value;

  if (
    !isRecord(location) ||
    typeof location.name !== 'string' ||
    typeof location.country !== 'string' ||
    !isRecord(current) ||
    !isNumber(current.temperature) ||
    !isNumber(current.apparentTemperature) ||
    !isNumber(current.relativeHumidity) ||
    !isNumber(current.windSpeed) ||
    !isNullableNumber(current.windDirection) ||
    !isNullableNumber(current.windGusts) ||
    !isNullableNumber(current.pressure) ||
    !isNullableNumber(current.cloudCover) ||
    !isNullableNumber(current.precipitationProbability) ||
    !isNumber(current.weatherCode) ||
    typeof current.description !== 'string' ||
    !isIconName(current.icon) ||
    typeof current.isDay !== 'boolean' ||
    !isRecord(daily) ||
    !isNullableNumber(daily.temperatureMax) ||
    !isNullableNumber(daily.temperatureMin) ||
    !Array.isArray(forecast) ||
    !Array.isArray(hourly) ||
    typeof updatedAt !== 'string' ||
    Number.isNaN(Date.parse(updatedAt)) ||
    typeof stale !== 'boolean' ||
    !isNumber(nextRefreshInMs) ||
    nextRefreshInMs < 0
  ) {
    throw new WeatherApiError('Respuesta meteorológica con formato inesperado');
  }

  return {
    location: { name: location.name, country: location.country },
    current: {
      temperature: current.temperature,
      apparentTemperature: current.apparentTemperature,
      relativeHumidity: current.relativeHumidity,
      windSpeed: current.windSpeed,
      windDirection: current.windDirection,
      windGusts: current.windGusts,
      pressure: current.pressure,
      cloudCover: current.cloudCover,
      precipitationProbability: current.precipitationProbability,
      weatherCode: current.weatherCode,
      description: current.description,
      icon: current.icon,
      isDay: current.isDay,
    },
    daily: { temperatureMax: daily.temperatureMax, temperatureMin: daily.temperatureMin },
    forecast: forecast.map(parseDailyForecast),
    hourly: hourly.map(parseHourlyForecast),
    updatedAt,
    stale,
    nextRefreshInMs,
  };
}

export async function fetchWeather(signal?: AbortSignal): Promise<WeatherData> {
  let response: Response;
  try {
    response = await fetch(WEATHER_ENDPOINT, { signal: signal ?? null });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new WeatherApiError('No se pudo conectar con el servidor local', { cause: error });
  }

  if (!response.ok) {
    throw new WeatherApiError(
      response.status === 503
        ? 'La información meteorológica no está disponible'
        : `Error del servidor (${response.status})`,
    );
  }

  const body: unknown = await response.json();
  return parseWeatherData(body);
}
