import type { FastifyPluginAsync } from 'fastify';

import type { NewsService } from './news.service.js';
import { NEWS_FEEDS, type NewsFeed } from './news.types.js';

const NOT_FOUND = 404;

export interface NewsRoutesOptions {
  newsService: NewsService;
}

function isNewsFeed(value: string): value is NewsFeed {
  return (NEWS_FEEDS as readonly string[]).includes(value);
}

export const newsRoutes: FastifyPluginAsync<NewsRoutesOptions> = async (app, { newsService }) => {
  // POST porque elegir las noticias las marca como mostradas.
  app.post<{ Params: { feed: string } }>('/api/news/:feed/rotation', async (request, reply) => {
    reply.header('Cache-Control', 'no-store');
    const { feed } = request.params;
    if (!isNewsFeed(feed)) {
      return reply.code(NOT_FOUND).send({ error: 'NEWS_FEED_NOT_FOUND', message: 'Feed de noticias desconocido' });
    }
    return newsService.nextRotation(feed);
  });
};
