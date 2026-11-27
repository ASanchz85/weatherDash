import { describe, expect, it } from 'vitest';

import { NEWS_FEED_IDS } from '../../types/news';
import { AVAILABLE_VIDEOS, VIDEO_URLS } from './videoUrls';

describe('VIDEO_URLS', () => {
  it('cada feed de noticias y el tiempo tienen su v\u00eddeo en assets/video', () => {
    expect(Object.keys(VIDEO_URLS).sort()).toEqual(['weather', ...NEWS_FEED_IDS].sort());
    Object.values(VIDEO_URLS).forEach((url) => expect(url).toEqual(expect.any(String)));
  });

  it('AVAILABLE_VIDEOS lista los v\u00eddeos que existen', () => {
    expect([...AVAILABLE_VIDEOS].sort()).toEqual(['weather', ...NEWS_FEED_IDS].sort());
  });
});
