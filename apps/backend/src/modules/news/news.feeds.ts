/** Proveedores que saben leer un tipo de feed; varios feeds pueden compartir uno. */
export type NewsSource = 'europa-press' | 'expansion' | 'commemorations' | 'motorsport' | 'nba';

interface NewsFeedDefinition {
  source: NewsSource;
  /** Variable de entorno que sobrescribe la URL del feed. */
  envVar: string;
  defaultUrl: string;
  /** El contenido solo vale el día en que se publica (efemérides): se conserva hoy y se consulta una vez al día. */
  daily?: true;
}

/** Fuente única de los feeds de noticias: de aquí salen los tipos, la configuración, las pantallas fijables y los proveedores. */
export const NEWS_FEED_DEFINITIONS = {
  national: {
    source: 'europa-press',
    envVar: 'NEWS_FEED_NATIONAL_URL',
    defaultUrl: 'https://www.europapress.es/rss/rss.aspx?ch=66',
  },
  international: {
    source: 'europa-press',
    envVar: 'NEWS_FEED_INTERNATIONAL_URL',
    defaultUrl: 'https://www.europapress.es/rss/rss.aspx?ch=69',
  },
  economy: {
    source: 'expansion',
    envVar: 'NEWS_FEED_ECONOMY_URL',
    defaultUrl: 'https://e00-expansion.uecdn.es/rss/economia.xml',
  },
  markets: {
    source: 'expansion',
    envVar: 'NEWS_FEED_MARKETS_URL',
    defaultUrl: 'https://e00-expansion.uecdn.es/rss/mercados.xml',
  },
  commemorations: {
    source: 'commemorations',
    envVar: 'NEWS_FEED_COMMEMORATIONS_URL',
    // {MM} y {DD} se sustituyen por el mes y el día locales de hoy.
    defaultUrl: 'https://es.wikipedia.org/api/rest_v1/feed/onthisday/events/{MM}/{DD}',
    daily: true,
  },
  motorsport: {
    source: 'motorsport',
    envVar: 'NEWS_FEED_MOTORSPORT_URL',
    defaultUrl: 'https://es.motorsport.com/rss/all/news/',
  },
  nba: {
    source: 'nba',
    envVar: 'NEWS_FEED_NBA_URL',
    defaultUrl: 'https://www.nbamaniacs.com/feed/',
  },
} as const satisfies Record<string, NewsFeedDefinition>;

/** Origen de la petición; es independiente de la categoría que publica el proveedor en cada noticia. */
export type NewsFeed = keyof typeof NEWS_FEED_DEFINITIONS;

export const NEWS_FEEDS = Object.keys(NEWS_FEED_DEFINITIONS) as readonly NewsFeed[];

export type NewsFeedEnvVar = (typeof NEWS_FEED_DEFINITIONS)[NewsFeed]['envVar'];

export function isNewsFeed(value: string): value is NewsFeed {
  return Object.hasOwn(NEWS_FEED_DEFINITIONS, value);
}

export function isDailyFeed(feed: NewsFeed): boolean {
  return 'daily' in NEWS_FEED_DEFINITIONS[feed];
}

/** Construye un registro con un valor por feed, siguiendo el orden de `NEWS_FEEDS`. */
export function mapFeeds<T>(build: (feed: NewsFeed) => T): Record<NewsFeed, T> {
  return Object.fromEntries(NEWS_FEEDS.map((feed) => [feed, build(feed)])) as Record<NewsFeed, T>;
}
