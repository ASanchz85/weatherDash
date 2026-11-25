import { describe, expect, it, vi } from 'vitest';

import { EXPANSION_FEED_XML } from '../../../test/fixtures.js';
import { NewsProviderError } from '../news.http.js';
import { adaptExpansionItems } from './expansion.adapter.js';
import { createExpansionProvider, parseExpansionFeed } from './expansion.provider.js';

const LINK = 'https://www.expansion.com/mercados/2026/10/27/6ae0794b468aeb796d8b459e.html';
const IMAGE = 'https://e00-expansion.uecdn.es/assets/multimedia/imagenes/2026/10/27/17930959876861.jpg';

describe('adaptExpansionItems', () => {
  it('descarta items sin imagen, con fecha inválida o sin titular', () => {
    const valid = {
      title: 'T',
      link: 'https://x.es/a',
      'media:content': [{ '@_url': IMAGE }],
      pubDate: 'Tue, 27 Oct 2026 13:26:41 +0100',
    };

    expect(adaptExpansionItems([valid, { ...valid, 'media:content': undefined }])).toHaveLength(1);
    expect(adaptExpansionItems([{ ...valid, pubDate: 'ayer' }, { ...valid, title: '<![CDATA[  ]]>' }])).toEqual([]);
    expect(adaptExpansionItems(['no es un objeto', null])).toEqual([]);
  });

  it('usa el enlace como guid cuando falta y deja la descripción vacía sin media:description', () => {
    const [item] = adaptExpansionItems([
      {
        title: 'T',
        link: 'https://x.es/a/',
        'media:content': [{ '@_url': IMAGE }],
        pubDate: 'Tue, 27 Oct 2026 13:26:41 +0100',
      },
    ]);

    expect(item).toMatchObject({ guid: 'https://x.es/a', description: '', category: '' });
  });
});

describe('parseExpansionFeed', () => {
  it('normaliza el feed: media:description, primera categoría, imagen intacta y sin duplicados', () => {
    expect(parseExpansionFeed(EXPANSION_FEED_XML)).toEqual([
      {
        title: 'Solaria y Merlin aceleran en el Ibex con el nuevo decreto de centros de datos',
        link: LINK,
        description:
          'La reformulación del decreto resulta aún "insuficiente", a juicio de los analistas. Solaria y Merlin despuntan en el Ibex.',
        enclosureUrl: IMAGE,
        guid: LINK,
        publishedAt: Date.UTC(2026, 9, 27, 12, 26, 41),
        category: 'Mercados',
      },
    ]);
  });

  it('acepta un feed sin noticias', () => {
    expect(parseExpansionFeed('<rss version="2.0"><channel><title>Vacío</title></channel></rss>')).toEqual([]);
  });

  it('rechaza documentos que no son un RSS', () => {
    expect(() => parseExpansionFeed('<html><body>Error</body></html>')).toThrow(NewsProviderError);
  });
});

describe('createExpansionProvider', () => {
  it('descarga el feed con timeout y lo adapta', async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response(EXPANSION_FEED_XML));
    const provider = createExpansionProvider({ requestTimeoutMs: 5000, fetchFn });

    const items = await provider.fetchFeed('https://example.com/mercados.xml');

    expect(items).toHaveLength(1);
    expect(fetchFn).toHaveBeenCalledWith('https://example.com/mercados.xml', { signal: expect.any(AbortSignal) });
  });

  it('convierte los fallos de red y los estados HTTP de error en NewsProviderError', async () => {
    const network = createExpansionProvider({
      requestTimeoutMs: 5000,
      fetchFn: vi.fn().mockRejectedValue(new TypeError('fetch failed')),
    });
    const http = createExpansionProvider({
      requestTimeoutMs: 5000,
      fetchFn: vi.fn().mockResolvedValue(new Response('', { status: 503 })),
    });

    await expect(network.fetchFeed('https://example.com')).rejects.toThrow(NewsProviderError);
    await expect(http.fetchFeed('https://example.com')).rejects.toThrow(/HTTP 503/);
  });
});
