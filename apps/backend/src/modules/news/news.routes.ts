import type { FastifyPluginAsync } from 'fastify';

import { isNewsFeed } from './news.feeds.js';
import type { NewsService } from './news.service.js';

const NOT_FOUND = 404;

export interface NewsRoutesOptions {
  newsService: NewsService;
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
