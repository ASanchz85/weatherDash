import { describe, expect, it } from 'vitest';

import { NEWS_CYCLE_ORDER, NEWS_FEED_IDS, NEWS_FEEDS } from './news';

describe('registro de feeds de noticias', () => {
  it('cada feed del registro aparece al menos una vez en el ciclo y el ciclo solo usa feeds del registro', () => {
    NEWS_FEED_IDS.forEach((feed) => expect(NEWS_CYCLE_ORDER).toContain(feed));
    NEWS_CYCLE_ORDER.forEach((feed) => expect(NEWS_FEED_IDS).toContain(feed));
  });

  it('las efemer\u00eddes se intercalan cada dos bloques de noticias', () => {
    const blocks = NEWS_CYCLE_ORDER.reduce<string[][]>(
      (groups, feed) => {
        if (feed === 'commemorations') return [...groups, []];
        groups.at(-1)?.push(feed);
        return groups;
      },
      [[]],
    );

    blocks.slice(0, -1).forEach((block) => expect(block.length).toBeLessThanOrEqual(2));
  });

  it('cada feed tiene etiqueta, proveedor y v\u00eddeo', () => {
    NEWS_FEED_IDS.forEach((feed) => {
      const { label, source, video } = NEWS_FEEDS[feed];
      expect([label, source, video].every((text) => text.trim() !== '')).toBe(true);
    });
  });
});
