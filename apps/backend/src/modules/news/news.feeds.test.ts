import { describe, expect, it } from 'vitest';

import {
  isDailyFeed,
  isNewsFeed,
  mapFeeds,
  NEWS_FEED_DEFINITIONS,
  NEWS_FEEDS,
  type NewsSource,
} from './news.feeds.js';

const KNOWN_SOURCES: readonly NewsSource[] = ['europa-press', 'expansion', 'commemorations', 'motorsport', 'nba'];

describe('registro de feeds de noticias', () => {
  const definitions = NEWS_FEEDS.map((feed) => ({ feed, ...NEWS_FEED_DEFINITIONS[feed] }));

  it('cada feed declara una fuente conocida y una URL por defecto v\u00e1lida', () => {
    definitions.forEach(({ source, defaultUrl }) => {
      expect(KNOWN_SOURCES).toContain(source);
      expect(() => new URL(defaultUrl)).not.toThrow();
    });
  });

  it('las variables de entorno siguen el patr\u00f3n NEWS_FEED_<ID>_URL y no se repiten', () => {
    definitions.forEach(({ feed, envVar }) => expect(envVar).toBe(`NEWS_FEED_${feed.toUpperCase()}_URL`));
    expect(new Set(definitions.map(({ envVar }) => envVar)).size).toBe(definitions.length);
  });

  it('solo las efem\u00e9rides son un feed diario', () => {
    expect(NEWS_FEEDS.filter(isDailyFeed)).toEqual(['commemorations']);
  });

  it('isNewsFeed distingue los feeds del registro de cualquier otro texto', () => {
    expect(isNewsFeed('national')).toBe(true);
    expect(isNewsFeed('deportes')).toBe(false);
    expect(isNewsFeed('constructor')).toBe(false);
  });

  it('mapFeeds crea un valor por feed en el orden del registro', () => {
    const record = mapFeeds((feed) => feed.length);

    expect(Object.keys(record)).toEqual([...NEWS_FEEDS]);
    expect(record.national).toBe('national'.length);
  });
});
