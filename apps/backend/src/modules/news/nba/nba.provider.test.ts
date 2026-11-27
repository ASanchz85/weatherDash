import { describe, expect, it, vi } from 'vitest';

import { NBA_FEED_XML } from '../../../test/fixtures.js';
import { NewsProviderError } from '../news.http.js';
import { adaptNbaItems } from './nba.adapter.js';
import { createNbaProvider, parseNbaFeed } from './nba.provider.js';

describe('parseNbaFeed', () => {
  it('normaliza el feed: imagen aunque el vídeo vaya primero, sección como categoría y resumen sin restos de WordPress', () => {
    expect(parseNbaFeed(NBA_FEED_XML)).toEqual([
      {
        title: '¿Ha cambiado el arbitraje de la NBA?',
        link: 'https://www.nbamaniacs.com/articulos/cambios-arbitraje-nba',
        description:
          'La liga parece por fin haberse tomado en serio los puntos de énfasis anunciados en el mes de septiembre',
        enclosureUrl: 'https://www.nbamaniacs.com/wp-content/uploads/2026/11/arbitraje-nba.jpg',
        guid: 'https://www.nbamaniacs.com/?p=437944',
        publishedAt: Date.UTC(2026, 10, 27, 9),
        category: 'Artículos',
      },
      {
        title: 'Sobreviviendo a los ‘anotadores’ (jornada 25/11/2026)',
        link: 'https://www.nbamaniacs.com/pospartidos/sobreviviendo-anotadores-25-11-2026',
        description: 'Una noche NBA para recordar que tener una gran estrella no siempre triunfa',
        enclosureUrl: 'https://www.nbamaniacs.com/wp-content/uploads/2026/11/jue26-giannis.jpg',
        guid: 'https://www.nbamaniacs.com/?p=437876',
        publishedAt: Date.UTC(2026, 10, 26, 10, 0, 15),
        category: 'Pospartidos NBA',
      },
    ]);
  });

  it('descarta las noticias que solo traen vídeo', () => {
    expect(parseNbaFeed(NBA_FEED_XML).map((item) => item.title)).not.toContain('Solo trae un vídeo');
  });

  it('acepta un feed sin noticias y rechaza documentos que no son un RSS', () => {
    expect(parseNbaFeed('<rss version="2.0"><channel><title>Vacío</title></channel></rss>')).toEqual([]);
    expect(() => parseNbaFeed('<html><body>Error</body></html>')).toThrow(NewsProviderError);
  });
});

describe('adaptNbaItems', () => {
  it('usa el enlace como guid y deja la descripción y la categoría vacías cuando faltan', () => {
    const [item] = adaptNbaItems([
      {
        title: 'T',
        link: 'https://www.nbamaniacs.com/a/',
        enclosure: [{ '@_url': 'https://www.nbamaniacs.com/a.jpg' }],
        pubDate: 'Fri, 27 Nov 2026 09:00:00 +0000',
      },
    ]);

    expect(item).toMatchObject({ guid: 'https://www.nbamaniacs.com/a', description: '', category: '' });
  });
});

describe('createNbaProvider', () => {
  it('descarga el feed con timeout y lo adapta', async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response(NBA_FEED_XML));
    const provider = createNbaProvider({ requestTimeoutMs: 5000, fetchFn });

    const items = await provider.fetchFeed('https://example.com/nba.xml');

    expect(items).toHaveLength(2);
    expect(fetchFn).toHaveBeenCalledWith('https://example.com/nba.xml', { signal: expect.any(AbortSignal) });
  });

  it('convierte los fallos de red y los estados HTTP de error en NewsProviderError', async () => {
    const network = createNbaProvider({
      requestTimeoutMs: 5000,
      fetchFn: vi.fn().mockRejectedValue(new TypeError('fetch failed')),
    });
    const http = createNbaProvider({
      requestTimeoutMs: 5000,
      fetchFn: vi.fn().mockResolvedValue(new Response('', { status: 500 })),
    });

    await expect(network.fetchFeed('https://example.com')).rejects.toThrow(NewsProviderError);
    await expect(http.fetchFeed('https://example.com')).rejects.toThrow(/HTTP 500/);
  });
});
