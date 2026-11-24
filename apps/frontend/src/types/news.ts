export const NEWS_FEED_IDS = ['national', 'international', 'markets'] as const;

export type NewsFeedId = (typeof NEWS_FEED_IDS)[number];

/** Etiqueta propia de cada feed; no coincide necesariamente con la categoría que publica Europa Press. */
export const NEWS_FEED_LABELS: Readonly<Record<NewsFeedId, string>> = {
  national: 'Nacional',
  international: 'Internacional',
  markets: 'Mercados',
};

export interface NewsItem {
  id: number;
  title: string;
  description: string;
  /** Foto ya en la resolución que se muestra en el hero. */
  imageUrl: string;
  /** Fecha de publicación en formato ISO. */
  publishedAt: string;
  /** Categoría publicada por Europa Press. */
  category: string;
}

export interface NewsRotation {
  feed: NewsFeedId;
  /** Noticias que caben en la lista lateral; `items` puede traer menos. */
  size: number;
  items: NewsItem[];
}
