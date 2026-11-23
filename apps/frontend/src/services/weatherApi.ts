import { WEATHER_ENDPOINT } from '../config';
import type { WeatherData, WeatherIconName } from '../types/weather';

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

/** Valida en tiempo de ejecución la respuesta de la API local antes de usarla en la interfaz. */
export function parseWeatherData(value: unknown): WeatherData {
  if (!isRecord(value)) throw new WeatherApiError('Respuesta meteorológica no válida');
  const { location, current, daily, updatedAt, stale } = value;

  if (
    !isRecord(location) ||
    typeof location.name !== 'string' ||
    typeof location.country !== 'string' ||
    !isRecord(current) ||
    !isNumber(current.temperature) ||
    !isNumber(current.apparentTemperature) ||
    !isNumber(current.relativeHumidity) ||
    !isNumber(current.windSpeed) ||
    !isNullableNumber(current.precipitationProbability) ||
    !isNumber(current.weatherCode) ||
    typeof current.description !== 'string' ||
    !isIconName(current.icon) ||
    typeof current.isDay !== 'boolean' ||
    !isRecord(daily) ||
    !isNullableNumber(daily.temperatureMax) ||
    !isNullableNumber(daily.temperatureMin) ||
    typeof updatedAt !== 'string' ||
    Number.isNaN(Date.parse(updatedAt)) ||
    typeof stale !== 'boolean'
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
      precipitationProbability: current.precipitationProbability,
      weatherCode: current.weatherCode,
      description: current.description,
      icon: current.icon,
      isDay: current.isDay,
    },
    daily: { temperatureMax: daily.temperatureMax, temperatureMin: daily.temperatureMin },
    updatedAt,
    stale,
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
