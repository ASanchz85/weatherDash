import { describe, expect, it } from 'vitest';

import { dropDuplicateLinks, normalizeLink } from './expansion.dedupe.js';

describe('normalizeLink', () => {
  it('quita fragmento, parámetros de seguimiento y barra final', () => {
    expect(normalizeLink('https://www.expansion.com/a/b.html?utm_source=rss&id=3#comentarios')).toBe(
      'https://www.expansion.com/a/b.html?id=3',
    );
    expect(normalizeLink('https://www.expansion.com/a/b/')).toBe('https://www.expansion.com/a/b');
  });
});

describe('dropDuplicateLinks', () => {
  it('conserva la primera noticia de cada enlace', () => {
    const items = [
      { link: 'https://x.es/a', title: 'primera' },
      { link: 'https://x.es/b', title: 'otra' },
      { link: 'https://x.es/a/?utm_medium=rss', title: 'repetida' },
    ];

    expect(dropDuplicateLinks(items).map((item) => item.title)).toEqual(['primera', 'otra']);
  });
});
