/** El orden es el del ciclo de rotación del dashboard. */
export const NEWS_FEEDS = ['national', 'international', 'economy', 'markets', 'commemorations'] as const;

/** Origen de la petición; es independiente de la categoría que publica el proveedor en cada noticia. */
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
  /** Categoría publicada por el proveedor. */
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
  /** Máximo de noticias por rotación; `items` puede traer menos. */
  size: number;
  items: NewsItemDto[];
}
