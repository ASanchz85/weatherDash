import { XMLParser } from 'fast-xml-parser';
import { z } from 'zod';

import { fetchFeedText, NewsProviderError, type FeedRequestOptions } from '../news.http.js';
import type { NewsProvider } from '../news.provider.js';
import type { ParsedNewsItem } from '../news.types.js';
import { adaptExpansionItems } from './expansion.adapter.js';

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
  isArray: (name) => name === 'item' || name === 'category' || name === 'media:content',
});

export function parseExpansionFeed(xml: string): ParsedNewsItem[] {
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

  return adaptExpansionItems(feed.data.rss.channel.item);
}

export function createExpansionProvider(options: FeedRequestOptions): NewsProvider {
  return {
    async fetchFeed(url) {
      return parseExpansionFeed(await fetchFeedText(url, options));
    },
  };
}
