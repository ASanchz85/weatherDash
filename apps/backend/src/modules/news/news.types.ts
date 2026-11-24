export const NEWS_FEEDS = ['national', 'international', 'markets'] as const;

/** Origen de la petición; es independiente de la categoría que publica Europa Press en cada noticia. */
export type NewsFeed = (typeof NEWS_FEEDS)[number];

/** Noticia normalizada a partir de un `item` del RSS. */
export interface ParsedNewsItem {
  title: string;
  link: string;
  description: string;
  enclosureUrl: string;
  guid: string;
  /** Instante de publicación en milisegundos desde epoch. */
  publishedAt: number;
  /** Categoría publicada por Europa Press. */
  category: string;
}

export interface NewsItem extends ParsedNewsItem {
  id: number;
  feed: NewsFeed;
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
  items: NewsItemDto[];
}
