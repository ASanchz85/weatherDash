import { UI_CONFIG_ENDPOINT } from '../config';
import { NEWS_FEED_IDS, type NewsFeedId } from '../types/news';

export class ConfigApiError extends Error {
  override readonly name = 'ConfigApiError';
}

/** Pantalla fijada desde el backend: una página del tiempo o la vista de un feed de noticias. */
export interface PinnedScreen {
  page: number | null;
  feed: NewsFeedId | null;
}

export interface UiConfig {
  /** Tiempo entre cambios de vista; 0 indica que la rotación está desactivada. */
  rotationIntervalMs: number;
  /** Tiempo que cada noticia permanece resaltada. */
  newsItemDurationMs: number;
  /** Si existe, solo se muestra esa pantalla, sin rotación ni diapositivas. */
  pinnedScreen?: PinnedScreen | null;
}

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

/** `weather-N` (N desde 1) o `news-<feed>`; cualquier otro valor se ignora y se muestran todas las pantallas. */
export function parsePinnedScreen(value: unknown): PinnedScreen | null {
  if (typeof value !== 'string') return null;

  const weather = /^weather-([1-9]\d*)$/.exec(value);
  if (weather) return { page: Number(weather[1]) - 1, feed: null };

  const feed = NEWS_FEED_IDS.find((candidate) => `news-${candidate}` === value);
  return feed ? { page: null, feed } : null;
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
  const pinnedScreen = parsePinnedScreen('pinnedScreen' in value ? value.pinnedScreen : undefined);
  return pinnedScreen ? { rotationIntervalMs, newsItemDurationMs, pinnedScreen } : { rotationIntervalMs, newsItemDurationMs };
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
