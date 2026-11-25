import { XMLParser } from 'fast-xml-parser';
import { z } from 'zod';

import { fetchFeedText, NewsProviderError, type FeedRequestOptions } from './news.http.js';
import type { ParsedNewsItem } from './news.types.js';

export { NewsProviderError };

export type NewsProviderOptions = FeedRequestOptions;

export interface NewsProvider {
  /** Descarga un feed RSS y devuelve sus noticias válidas; las que no traen imagen se descartan. */
  fetchFeed(url: string): Promise<ParsedNewsItem[]>;
}

const httpUrl = z.url({ protocol: /^https?$/ });
const requiredText = z.string().trim().min(1);

const itemSchema = z.object({
  title: requiredText,
  link: httpUrl,
  description: z.string().trim().default(''),
  enclosure: z.object({ '@_url': httpUrl }),
  // Con atributos activados, guid llega como objeto cuando lleva isPermaLink.
  guid: z.union([requiredText, z.object({ '#text': requiredText })]).optional(),
  pubDate: z
    .string()
    .transform((value) => Date.parse(value))
    .refine((value) => !Number.isNaN(value)),
  category: z.string().trim().default(''),
});

const feedSchema = z.object({
  rss: z.object({
    channel: z.object({ item: z.array(z.unknown()).default([]) }),
  }),
});

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  // Todo se mantiene como texto: un titular como "2026" no debe convertirse en número.
  parseTagValue: false,
  parseAttributeValue: false,
  isArray: (name) => name === 'item',
});

export function parseNewsFeed(xml: string): ParsedNewsItem[] {
  let document: unknown;
  try {
    document = parser.parse(xml);
  } catch (error) {
    throw new NewsProviderError('El feed de noticias no es un XML válido', { cause: error });
  }

  const feed = feedSchema.safeParse(document);
  if (!feed.success) {
    throw new NewsProviderError('El feed de noticias tiene un formato inesperado', { cause: feed.error });
  }

  return feed.data.rss.channel.item.flatMap((raw) => {
    const item = itemSchema.safeParse(raw);
    if (!item.success) return [];
    const { title, link, description, enclosure, guid, pubDate, category } = item.data;
    return [
      {
        title,
        link,
        description,
        enclosureUrl: enclosure['@_url'],
        guid: typeof guid === 'string' ? guid : (guid?.['#text'] ?? link),
        publishedAt: pubDate,
        category,
      },
    ];
  });
}

export function createNewsProvider(options: NewsProviderOptions): NewsProvider {
  return {
    async fetchFeed(url) {
      return parseNewsFeed(await fetchFeedText(url, options));
    },
  };
}
