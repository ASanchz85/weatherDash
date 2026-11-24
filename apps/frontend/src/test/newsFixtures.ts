import type { NewsItem, NewsRotation } from '../types/news';

export function buildNewsItems(count = 3): NewsItem[] {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    title: `Titular ${index + 1}`,
    description: `Descripción de la noticia ${index + 1}`,
    imageUrl: `https://img.europapress.es/fotoweb/fotonoticia_${index + 1}_800.jpg`,
    publishedAt: '2026-11-24T07:32:49.000Z',
    category: 'Internacional',
  }));
}

export function buildNewsRotation(feed: NewsRotation['feed'] = 'national', count = 3): NewsRotation {
  return { feed, items: buildNewsItems(count) };
}
