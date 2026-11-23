import { resolve } from 'node:path';

import { z } from 'zod';

import { DEFAULT_DATABASE_PATH, FRONTEND_DIST_PATH, ROOT_PATH } from './paths.js';

const DEFAULT_PORT = 3000;
const DEFAULT_LOCATION_NAME = 'Navaluenga';
const DEFAULT_FALLBACK_LOCATION_NAME = 'Ávila';
const DEFAULT_COUNTRY = 'España';
const DEFAULT_COUNTRY_CODE = 'ES';
const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
const DEFAULT_REQUEST_TIMEOUT_MS = 8000;
const MIN_REFRESH_INTERVAL_MS = 60 * 1000;
const DEFAULT_ROTATION_INTERVAL_MS = 5 * 60 * 1000;
const MIN_ROTATION_INTERVAL_MS = 10 * 1000;

/** Las variables vacías en .env se tratan como no definidas. */
function blankToUndefined(value: unknown): unknown {
  return typeof value === 'string' && value.trim() === '' ? undefined : value;
}

const optionalText = z.preprocess(blankToUndefined, z.string().trim().min(1).optional());
const optionalCoordinate = (min: number, max: number) =>
  z.preprocess(blankToUndefined, z.coerce.number().min(min).max(max).optional());

const envSchema = z
  .object({
    NODE_ENV: z.preprocess(
      blankToUndefined,
      z.enum(['development', 'production', 'test']).default('development'),
    ),
    PORT: z.preprocess(blankToUndefined, z.coerce.number().int().min(1).max(65535).default(DEFAULT_PORT)),
    HOST: z.preprocess(blankToUndefined, z.string().default('0.0.0.0')),
    DATABASE_PATH: optionalText,
    WEATHER_LOCATION_NAME: optionalText,
    WEATHER_FALLBACK_LOCATION_NAME: optionalText,
    WEATHER_COUNTRY: optionalText,
    WEATHER_COUNTRY_CODE: z.preprocess(
      blankToUndefined,
      z.string().trim().length(2).toUpperCase().optional(),
    ),
    WEATHER_LATITUDE: optionalCoordinate(-90, 90),
    WEATHER_LONGITUDE: optionalCoordinate(-180, 180),
    WEATHER_TIMEZONE: optionalText,
    WEATHER_REFRESH_INTERVAL: z.preprocess(
      blankToUndefined,
      z.coerce.number().int().min(MIN_REFRESH_INTERVAL_MS).default(FIFTEEN_MINUTES_MS),
    ),
    WEATHER_REQUEST_TIMEOUT: z.preprocess(
      blankToUndefined,
      z.coerce.number().int().positive().default(DEFAULT_REQUEST_TIMEOUT_MS),
    ),
    // 0 desactiva la rotación de vistas.
    UI_ROTATION_INTERVAL: z
      .preprocess(
        blankToUndefined,
        z.coerce.number().int().min(0).default(DEFAULT_ROTATION_INTERVAL_MS),
      )
      .refine((value) => value === 0 || value >= MIN_ROTATION_INTERVAL_MS, {
        message: `debe ser 0 (desactivada) o al menos ${MIN_ROTATION_INTERVAL_MS} ms`,
      }),
  })
  .refine((env) => (env.WEATHER_LATITUDE === undefined) === (env.WEATHER_LONGITUDE === undefined), {
    message: 'WEATHER_LATITUDE y WEATHER_LONGITUDE deben definirse juntas o dejarse ambas vacías',
    path: ['WEATHER_LATITUDE'],
  });

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface WeatherConfig {
  locationName: string;
  fallbackLocationName: string | null;
  country: string;
  countryCode: string | null;
  /** Coordenadas explícitas; si son null se resuelven mediante geocoding. */
  coordinates: Coordinates | null;
  /** Zona horaria IANA; si es null se usa la devuelta por el geocoding. */
  timezone: string | null;
  refreshIntervalMs: number;
  requestTimeoutMs: number;
}

export interface UiConfig {
  /** Tiempo entre cambios de vista en la interfaz; 0 desactiva la rotación. */
  rotationIntervalMs: number;
}

export interface AppConfig {
  nodeEnv: 'development' | 'production' | 'test';
  host: string;
  port: number;
  /** Directorio del frontend compilado; solo se sirve en producción. */
  staticDir: string | null;
  /** Ruta absoluta del fichero SQLite donde se conserva la última información obtenida. */
  databasePath: string;
  weather: WeatherConfig;
  ui: UiConfig;
}

export class ConfigError extends Error {
  override readonly name = 'ConfigError';
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const result = envSchema.safeParse(env);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new ConfigError(`Configuración no válida: ${details}`);
  }

  const parsed = result.data;
  const coordinates =
    parsed.WEATHER_LATITUDE !== undefined && parsed.WEATHER_LONGITUDE !== undefined
      ? { latitude: parsed.WEATHER_LATITUDE, longitude: parsed.WEATHER_LONGITUDE }
      : null;

  return {
    nodeEnv: parsed.NODE_ENV,
    host: parsed.HOST,
    port: parsed.PORT,
    staticDir: parsed.NODE_ENV === 'production' ? FRONTEND_DIST_PATH : null,
    // Las rutas relativas se resuelven desde la raíz del repositorio, igual que el .env.
    databasePath: parsed.DATABASE_PATH ? resolve(ROOT_PATH, parsed.DATABASE_PATH) : DEFAULT_DATABASE_PATH,
    weather: {
      locationName: parsed.WEATHER_LOCATION_NAME ?? DEFAULT_LOCATION_NAME,
      fallbackLocationName: parsed.WEATHER_FALLBACK_LOCATION_NAME ?? DEFAULT_FALLBACK_LOCATION_NAME,
      country: parsed.WEATHER_COUNTRY ?? DEFAULT_COUNTRY,
      countryCode: parsed.WEATHER_COUNTRY_CODE ?? DEFAULT_COUNTRY_CODE,
      coordinates,
      timezone: parsed.WEATHER_TIMEZONE ?? null,
      refreshIntervalMs: parsed.WEATHER_REFRESH_INTERVAL,
      requestTimeoutMs: parsed.WEATHER_REQUEST_TIMEOUT,
    },
    ui: { rotationIntervalMs: parsed.UI_ROTATION_INTERVAL },
  };
}
