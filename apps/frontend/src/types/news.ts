interface NewsFeedDefinition {
  /** Etiqueta propia del feed; no coincide necesariamente con la categoría que publica el proveedor. */
  label: string;
  /** Proveedor que publica el feed; es el que firma el pie de foto del hero. */
  source: string;
  /** Nombre (sin extensión) del vídeo de transición en assets/video. */
  video: string;
}

/** Fuente única de los feeds de noticias; el orden en que se muestran en el ciclo es `NEWS_CYCLE_ORDER`. */
export const NEWS_FEEDS = {
  national: { label: 'Nacional', source: 'Europa Press', video: 'news-national' },
  international: { label: 'Internacional', source: 'Europa Press', video: 'news-international' },
  economy: { label: 'Economía', source: 'Expansión', video: 'news-economy' },
  markets: { label: 'Mercados', source: 'Expansión', video: 'news-stocks-and-markets' },
  commemorations: { label: 'Efemérides', source: 'Wikipedia', video: 'commemorations' },
} as const satisfies Record<string, NewsFeedDefinition>;

export type NewsFeedId = keyof typeof NEWS_FEEDS;

export const NEWS_FEED_IDS = Object.keys(NEWS_FEEDS) as readonly NewsFeedId[];

/** Orden de los bloques de noticias en el ciclo: las efemérides se intercalan cada dos bloques de noticias. */
export const NEWS_CYCLE_ORDER = [
  'national',
  'international',
  'commemorations',
  'economy',
  'markets',
  'commemorations',
] as const satisfies readonly NewsFeedId[];

export interface NewsItem {
  id: number;
  title: string;
  description: string;
  /** Foto ya en la resolución que se muestra en el hero. */
  imageUrl: string;
  /** Fecha de publicación en formato ISO. */
  publishedAt: string;
  /** Categoría publicada por el proveedor. */
  category: string;
}

export interface NewsRotation {
  feed: NewsFeedId;
  /** Noticias que caben en la lista lateral; `items` puede traer menos. */
  size: number;
  items: NewsItem[];
}
