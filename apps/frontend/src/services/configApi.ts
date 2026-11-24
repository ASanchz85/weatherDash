import { UI_CONFIG_ENDPOINT } from '../config';

export class ConfigApiError extends Error {
  override readonly name = 'ConfigApiError';
}

export interface UiConfig {
  /** Tiempo entre cambios de vista; 0 indica que la rotación está desactivada. */
  rotationIntervalMs: number;
  /** Tiempo que cada noticia permanece resaltada. */
  newsItemDurationMs: number;
}

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

export function parseUiConfig(value: unknown): UiConfig {
  if (typeof value !== 'object' || value === null || !('rotationIntervalMs' in value)) {
    throw new ConfigApiError('Configuración de interfaz con formato inesperado');
  }
  const { rotationIntervalMs } = value;
  const newsItemDurationMs = 'newsItemDurationMs' in value ? value.newsItemDurationMs : undefined;
  if (!isNonNegativeNumber(rotationIntervalMs) || !(typeof newsItemDurationMs === 'number' && newsItemDurationMs > 0)) {
    throw new ConfigApiError('Configuración de interfaz con formato inesperado');
  }
  return { rotationIntervalMs, newsItemDurationMs };
}

export async function fetchUiConfig(signal?: AbortSignal): Promise<UiConfig> {
  let response: Response;
  try {
    response = await fetch(UI_CONFIG_ENDPOINT, { signal: signal ?? null });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ConfigApiError('No se pudo conectar con el servidor local', { cause: error });
  }
  if (!response.ok) throw new ConfigApiError(`Error del servidor (${response.status})`);

  const body: unknown = await response.json();
  return parseUiConfig(body);
}
