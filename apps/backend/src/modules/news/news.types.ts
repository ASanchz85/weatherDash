import type { NewsFeed } from './news.feeds.js';

export { NEWS_FEEDS, type NewsFeed } from './news.feeds.js';

/** Noticia normalizada a partir de un `item` del RSS. */
export interface ParsedNewsItem {
  title: string;
  link: string;
  description: string;
  enclosureUrl: string;
  guid: string;
  /** Instante de publicación en milisegundos desde epoch. */
  publishedAt: number;
  /** Categoría publicada por el proveedor. */
  category: string;
}

export interface NewsItem extends ParsedNewsItem {
  id: number;
  feed: NewsFeed;
}

export interface NewsProvider {
  /** Descarga el feed y devuelve sus noticias válidas; las que no se pueden mostrar (p. ej. sin imagen) se descartan. */
  fetchFeed(url: string): Promise<ParsedNewsItem[]>;
}

/** Noticia tal y como la entrega la API. */
export interface NewsItemDto {
  id: number;
  title: string;
  link: string;
  description: string;
  enclosureUrl: string;
  guid: string;
  publishedAt: string;
  category: string;
}

export interface NewsRotation {
  feed: NewsFeed;
  /** Máximo de noticias por rotación; `items` puede traer menos. */
  size: number;
  items: NewsItemDto[];
}
