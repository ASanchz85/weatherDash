import { NEWS_FEED_IDS, type NewsFeedId } from '../../types/news';
import type { Theme } from '../../types/theme';

export interface DebugOverrides {
  /** Fija la página del tiempo mostrada y desactiva la rotación (?page=N). */
  page: number | null;
  /** Fuerza el tema sin esperar a los datos ni a la rotación (?theme=day|night). */
  theme: Theme | null;
  /** Fija la vista de noticias del feed indicado y desactiva la rotación (?feed=national|international|economy|markets|commemorations). */
  feed: NewsFeedId | null;
}

/** Parámetros de URL solo para depuración y capturas; los valores no válidos se ignoran. */
export function parseDebugOverrides(search: string): DebugOverrides {
  const params = new URLSearchParams(search);
  const rawPage = params.get('page');
  const rawTheme = params.get('theme');
  const rawFeed = params.get('feed');
  return {
    page: rawPage !== null && /^\d+$/.test(rawPage) ? Number(rawPage) : null,
    theme: rawTheme === 'day' || rawTheme === 'night' ? rawTheme : null,
    feed: NEWS_FEED_IDS.find((feed) => feed === rawFeed) ?? null,
  };
}
