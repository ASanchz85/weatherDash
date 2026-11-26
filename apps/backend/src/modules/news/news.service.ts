import type { ServiceLogger } from '../../shared/service-logger.js';
import type { NewsProvider } from './news.provider.js';
import type { NewsRepository } from './news.repository.js';
import { startOfDay, startOfPreviousDay } from './news.retention.js';
import { NEWS_FEEDS, type NewsFeed, type NewsRotation } from './news.types.js';

/** Feeds cuyo contenido solo vale el día en que se publica (efemérides): se conservan hoy y se consultan una vez al día. */
const DAILY_FEEDS: ReadonlySet<NewsFeed> = new Set<NewsFeed>(['commemorations']);

export interface NewsServiceOptions {
  /** Proveedor que sabe leer el RSS de cada feed. */
  providers: Record<NewsFeed, NewsProvider>;
  repository: NewsRepository;
  feedUrls: Record<NewsFeed, string>;
  /** Máximo de noticias que se entregan en cada rotación de un feed. */
  rotationSize: number;
  /** Zona horaria que define qué es «hoy» y «ayer». */
  timeZone: string;
  logger?: ServiceLogger;
  now?: () => number;
}

export interface NewsService {
  /** Consulta los feeds y actualiza la base de datos; los fallos de un feed no afectan a los demás. */
  refresh(): Promise<void>;
  nextRotation(feed: NewsFeed): NewsRotation;
}

export function createNewsService({
  providers,
  repository,
  feedUrls,
  rotationSize,
  timeZone,
  logger,
  now = Date.now,
}: NewsServiceOptions): NewsService {
  let pending: Promise<void> | null = null;

  async function refreshOnce(): Promise<void> {
    const todayStart = startOfDay(now(), timeZone);
    const yesterdayStart = startOfPreviousDay(now(), timeZone);

    await Promise.all(
      NEWS_FEEDS.map(async (feed) => {
        const isDaily = DAILY_FEEDS.has(feed);
        const cutoff = isDaily ? todayStart : yesterdayStart;
        repository.deleteOlderThan(cutoff, feed);
        if (isDaily && repository.hasItemsSince(feed, todayStart)) return;

        try {
          const items = await providers[feed].fetchFeed(feedUrls[feed]);
          repository.saveItems(
            feed,
            items.filter((item) => item.publishedAt >= cutoff),
          );
        } catch (error) {
          logger?.warn({ err: error, feed }, 'No se pudo actualizar el feed de noticias');
        }
      }),
    );
  }

  return {
    refresh() {
      pending ??= refreshOnce().finally(() => {
        pending = null;
      });
      return pending;
    },
    nextRotation(feed) {
      const sinceMs = DAILY_FEEDS.has(feed) ? startOfDay(now(), timeZone) : undefined;
      const items = repository.takeNextBatch(feed, rotationSize, sinceMs).map((item) => ({
        id: item.id,
        title: item.title,
        link: item.link,
        description: item.description,
        enclosureUrl: item.enclosureUrl,
        guid: item.guid,
        publishedAt: new Date(item.publishedAt).toISOString(),
        category: item.category,
      }));
      return { feed, size: rotationSize, items };
    },
  };
}
