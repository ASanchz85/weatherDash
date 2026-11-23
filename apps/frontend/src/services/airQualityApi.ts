import { AIR_QUALITY_ENDPOINT } from '../config';
import type { AirQualityData } from '../types/airQuality';

export class AirQualityApiError extends Error {
  override readonly name = 'AirQualityApiError';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isNullableNumber(value: unknown): value is number | null {
  return value === null || (typeof value === 'number' && Number.isFinite(value));
}

/** Valida en tiempo de ejecución la respuesta de la API local antes de usarla en la interfaz. */
export function parseAirQualityData(value: unknown): AirQualityData {
  if (!isRecord(value)) throw new AirQualityApiError('Respuesta de calidad del aire no válida');
  const { europeanAqi, pm25, dust, uvIndex, pollen, updatedAt, stale } = value;

  if (
    !isNullableNumber(europeanAqi) ||
    !isNullableNumber(pm25) ||
    !isNullableNumber(dust) ||
    !isNullableNumber(uvIndex) ||
    !isRecord(pollen) ||
    !isNullableNumber(pollen.olive) ||
    !isNullableNumber(pollen.grass) ||
    typeof updatedAt !== 'string' ||
    Number.isNaN(Date.parse(updatedAt)) ||
    typeof stale !== 'boolean'
  ) {
    throw new AirQualityApiError('Respuesta de calidad del aire con formato inesperado');
  }

  return {
    europeanAqi,
    pm25,
    dust,
    uvIndex,
    pollen: { olive: pollen.olive, grass: pollen.grass },
    updatedAt,
    stale,
  };
}

export async function fetchAirQuality(signal?: AbortSignal): Promise<AirQualityData> {
  let response: Response;
  try {
    response = await fetch(AIR_QUALITY_ENDPOINT, { signal: signal ?? null });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new AirQualityApiError('No se pudo conectar con el servidor local', { cause: error });
  }

  if (!response.ok) {
    throw new AirQualityApiError(
      response.status === 503
        ? 'La calidad del aire no está disponible'
        : `Error del servidor (${response.status})`,
    );
  }

  const body: unknown = await response.json();
  return parseAirQualityData(body);
}
