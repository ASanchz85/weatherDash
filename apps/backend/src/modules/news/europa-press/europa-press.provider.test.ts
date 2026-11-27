import { describe, expect, it, vi } from 'vitest';

import { NEWS_FEED_XML } from '../../../test/fixtures.js';
import { NewsProviderError } from '../news.http.js';
import { createEuropaPressProvider, parseEuropaPressFeed } from './europa-press.provider.js';

describe('parseEuropaPressFeed', () => {
  it('normaliza las noticias y descarta las que no traen imagen o tienen datos inválidos', () => {
    expect(parseEuropaPressFeed(NEWS_FEED_XML)).toEqual([
      {
        title: 'Diez años del acuerdo de paz en Colombia',
        link: 'https://www.europapress.es/internacional/noticia-colombia-20261124083249.html',
        description: 'La última década ha estado marcada por "la incapacidad" & la violencia',
        enclosureUrl: 'https://img.europapress.es/fotoweb/fotonoticia_20261124083249_120.jpg',
        guid: 'https://www.europapress.es/internacional/noticia-colombia-20261124083249.html',
        publishedAt: Date.UTC(2026, 10, 24, 7, 32, 49),
        category: 'Internacional',
      },
    ]);
  });

  it('acepta un feed sin noticias', () => {
    const xml = '<rss version="2.0"><channel><title>Vacío</title></channel></rss>';

    expect(parseEuropaPressFeed(xml)).toEqual([]);
  });

  it('usa el enlace como guid cuando el feed no lo trae', () => {
    const xml = `<rss version="2.0"><channel><item>
      <title>T</title><link>https://example.com/a</link>
      <enclosure url="https://example.com/a_120.jpg"/>
      <pubDate>Tue, 24 Nov 2026 07:32:49 GMT</pubDate>
    </item></channel></rss>`;

    expect(parseEuropaPressFeed(xml)).toMatchObject([{ guid: 'https://example.com/a', description: '', category: '' }]);
  });

  it('rechaza documentos que no son un RSS', () => {
    expect(() => parseEuropaPressFeed('<html><body>Error</body></html>')).toThrow(NewsProviderError);
  });
});

describe('createEuropaPressProvider', () => {
  it('descarga el feed con timeout y lo parsea', async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response(NEWS_FEED_XML));
    const provider = createEuropaPressProvider({ requestTimeoutMs: 5000, fetchFn });

    const items = await provider.fetchFeed('https://example.com/feed.xml');

    expect(items).toHaveLength(1);
    expect(fetchFn).toHaveBeenCalledWith('https://example.com/feed.xml', { signal: expect.any(AbortSignal) });
  });

  it('convierte los fallos de red y los estados HTTP de error en NewsProviderError', async () => {
    const network = createEuropaPressProvider({
      requestTimeoutMs: 5000,
      fetchFn: vi.fn().mockRejectedValue(new TypeError('fetch failed')),
    });
    const http = createEuropaPressProvider({
      requestTimeoutMs: 5000,
      fetchFn: vi.fn().mockResolvedValue(new Response('', { status: 500 })),
    });

    await expect(network.fetchFeed('https://example.com')).rejects.toThrow(NewsProviderError);
    await expect(http.fetchFeed('https://example.com')).rejects.toThrow(/HTTP 500/);
  });
});
