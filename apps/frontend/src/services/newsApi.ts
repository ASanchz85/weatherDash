import { newsRotationEndpoint } from '../config';
import { NEWS_FEED_IDS, type NewsFeedId, type NewsItem, type NewsRotation } from '../types/news';

export class NewsApiError extends Error {
  override readonly name = 'NewsApiError';
}

const THUMBNAIL_SUFFIX = /_120(\.[a-z0-9]+)(\?.*)?$/i;

/** Europa Press sirve la foto en el tamaño indicado al final de su nombre; se pide la de 800 en lugar de la de 120. */
export function upscaleEnclosure(url: string): string {
  return url.replace(THUMBNAIL_SUFFIX, '_800$1$2');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseItem(value: unknown): NewsItem {
  if (!isRecord(value)) throw new NewsApiError('Noticia con formato inesperado');
  const { id, title, description, enclosureUrl, publishedAt, category } = value;

  if (
    typeof id !== 'number' ||
    typeof title !== 'string' ||
    typeof description !== 'string' ||
    typeof enclosureUrl !== 'string' ||
    typeof publishedAt !== 'string' ||
    Number.isNaN(Date.parse(publishedAt)) ||
    typeof category !== 'string'
  ) {
    throw new NewsApiError('Noticia con formato inesperado');
  }

  return { id, title, description, imageUrl: upscaleEnclosure(enclosureUrl), publishedAt, category };
}

/** Valida en tiempo de ejecución la respuesta de la API local antes de usarla en la interfaz. */
export function parseNewsRotation(value: unknown): NewsRotation {
  if (!isRecord(value) || !Array.isArray(value.items)) {
    throw new NewsApiError('Respuesta de noticias con formato inesperado');
  }
  const feed = NEWS_FEED_IDS.find((candidate) => candidate === value.feed);
  if (!feed) throw new NewsApiError('Respuesta de noticias con formato inesperado');
  const { size } = value;
  if (typeof size !== 'number' || !Number.isInteger(size) || size < 1) {
    throw new NewsApiError('Respuesta de noticias con formato inesperado');
  }

  return { feed, size, items: value.items.map(parseItem) };
}

/** Pide las noticias de la siguiente rotación del feed; el servidor las marca como mostradas. */
export async function fetchNewsRotation(feed: NewsFeedId, signal?: AbortSignal): Promise<NewsRotation> {
  let response: Response;
  try {
    response = await fetch(newsRotationEndpoint(feed), { method: 'POST', signal: signal ?? null });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new NewsApiError('No se pudo conectar con el servidor local', { cause: error });
  }
  if (!response.ok) throw new NewsApiError(`Error del servidor (${response.status})`);

  const body: unknown = await response.json();
  return parseNewsRotation(body);
}
