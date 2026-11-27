import { XMLParser } from 'fast-xml-parser';
import { z } from 'zod';

import { fetchFeedText, NewsProviderError, type FeedRequestOptions } from './news.http.js';
import type { NewsProvider, ParsedNewsItem } from './news.types.js';

export interface RssSourceDefinition {
  /** Etiquetas que se leen siempre como lista aunque aparezcan una sola vez; `item` ya está incluida. */
  arrayTags?: readonly string[];
  /** Convierte los `item` crudos del canal en noticias, descartando las que no se pueden mostrar. */
  adapt(rawItems: readonly unknown[]): ParsedNewsItem[];
}

export interface RssSource {
  parseFeed(xml: string): ParsedNewsItem[];
  createProvider(options: FeedRequestOptions): NewsProvider;
}

const feedSchema = z.object({
  rss: z.object({
    channel: z.object({ item: z.array(z.unknown()).default([]) }),
  }),
});

/** Cada proveedor RSS solo aporta cómo adaptar sus `item`; el parseo, la validación del canal y los errores son comunes. */
export function defineRssSource({ arrayTags = [], adapt }: RssSourceDefinition): RssSource {
  const listTags = new Set(['item', ...arrayTags]);
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    // Todo se mantiene como texto: un titular como "2026" no debe convertirse en número.
    parseTagValue: false,
    parseAttributeValue: false,
    isArray: (name) => listTags.has(name),
  });

  function parseFeed(xml: string): ParsedNewsItem[] {
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

    return adapt(feed.data.rss.channel.item);
  }

  return {
    parseFeed,
    createProvider: (options) => ({
      async fetchFeed(url) {
        return parseFeed(await fetchFeedText(url, options));
      },
    }),
  };
}
