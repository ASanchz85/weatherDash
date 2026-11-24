import type { ServiceLogger } from '../../shared/service-logger.js';
import type { NewsProvider } from './news.provider.js';
import type { NewsRepository } from './news.repository.js';
import { startOfPreviousDay } from './news.retention.js';
import { NEWS_FEEDS, type NewsFeed, type NewsRotation } from './news.types.js';

/** Máximo de noticias que se muestran en cada rotación de un feed. */
export const NEWS_ROTATION_SIZE = 8;

export interface NewsServiceOptions {
  provider: NewsProvider;
  repository: NewsRepository;
  feedUrls: Record<NewsFeed, string>;
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
  provider,
  repository,
  feedUrls,
  timeZone,
  logger,
  now = Date.now,
}: NewsServiceOptions): NewsService {
  let pending: Promise<void> | null = null;

  async function refreshOnce(): Promise<void> {
    const cutoff = startOfPreviousDay(now(), timeZone);
    repository.deleteOlderThan(cutoff);

    await Promise.all(
      NEWS_FEEDS.map(async (feed) => {
        try {
          const items = await provider.fetchFeed(feedUrls[feed]);
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
      const items = repository.takeNextBatch(feed, NEWS_ROTATION_SIZE).map((item) => ({
        id: item.id,
        title: item.title,
        link: item.link,
        description: item.description,
        enclosureUrl: item.enclosureUrl,
        guid: item.guid,
        publishedAt: new Date(item.publishedAt).toISOString(),
        category: item.category,
      }));
      return { feed, items };
    },
  };
}
