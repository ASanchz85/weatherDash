import { describe, expect, it, vi } from 'vitest';

import { MOTORSPORT_FEED_XML } from '../../../test/fixtures.js';
import { NewsProviderError } from '../news.http.js';
import { adaptMotorsportItems } from './motorsport.adapter.js';
import { createMotorsportProvider, parseMotorsportFeed } from './motorsport.provider.js';

describe('parseMotorsportFeed', () => {
  it('normaliza el feed: serie como categoría, enlace sin seguimiento y resumen hasta la última frase', () => {
    expect(parseMotorsportFeed(MOTORSPORT_FEED_XML)).toEqual([
      {
        title: 'Márquez pulveriza el récord de la pista en su último viernes en MotoGP',
        link: 'https://es.motorsport.com/motogp/news/marquez-record-valencia/10878283',
        description:
          'Marc Márquez lideró la Práctica del GP de Valencia. El piloto de Ducati dejó claro que se va a ir subido a la ola.',
        enclosureUrl: 'https://cdn-1.motorsport.com/images/amp/0Lde9nN0/s6/marc-marquez-ducati-team.jpg',
        guid: '10878283',
        publishedAt: Date.UTC(2026, 10, 27, 15, 14, 30),
        category: 'MotoGP',
      },
      {
        title: 'Antonelli domina sobrado la FP1 de Qatar',
        link: 'https://es.motorsport.com/f1/news/resumen-fp1-qatar-2026/10878266',
        description:
          'El campeón no está aún de vacaciones. Antonelli dominó la primera sesión de libres, sacando más de medio segundo al resto.',
        enclosureUrl: 'https://cdn-1.motorsport.com/images/amp/YP74Vj82/s6/andrea-kimi-antonelli-mercedes.jpg',
        guid: '10878266',
        publishedAt: Date.UTC(2026, 10, 27, 14, 33, 31),
        category: 'Fórmula 1',
      },
    ]);
  });

  it('descarta las noticias sin imagen y las repetidas con otro parámetro de seguimiento', () => {
    const links = parseMotorsportFeed(MOTORSPORT_FEED_XML).map((item) => item.link);

    expect(links).toHaveLength(2);
    expect(links.some((link) => link.includes('sin-imagen'))).toBe(false);
  });

  it('acepta un feed sin noticias y rechaza documentos que no son un RSS', () => {
    expect(parseMotorsportFeed('<rss version="2.0"><channel><title>Vacío</title></channel></rss>')).toEqual([]);
    expect(() => parseMotorsportFeed('<html><body>Error</body></html>')).toThrow(NewsProviderError);
  });
});

describe('adaptMotorsportItems', () => {
  const base = {
    title: 'T',
    link: 'https://es.motorsport.com/f1/news/a/1/',
    enclosure: [{ '@_url': 'https://cdn-1.motorsport.com/a.jpg', '@_type': 'image/jpeg' }],
    pubDate: 'Fri, 27 Nov 2026 15:14:30 +0000',
  };

  it('usa el enlace como guid y deja la descripción vacía cuando faltan', () => {
    const [item] = adaptMotorsportItems([base]);

    expect(item).toMatchObject({ guid: 'https://es.motorsport.com/f1/news/a/1', description: '', category: '' });
  });

  it('corta el resumen en el primer bloque de enlaces relacionados', () => {
    const [item] = adaptMotorsportItems([
      { ...base, description: 'Primera frase. Segunda frase.<br>SÍGUELO EN DIRECTO:<br><br>Fórmula 1F1 en vivo' },
    ]);

    expect(item?.description).toBe('Primera frase. Segunda frase.');
  });

  it('deja el resumen como está si no hay ninguna frase completa', () => {
    const [item] = adaptMotorsportItems([
      { ...base, description: 'Un resumen sin punto ...<a class="more" href="https://x.es">Sigue leyendo</a>' },
    ]);

    expect(item?.description).toBe('Un resumen sin punto...');
  });

  it('usa solo una categoría cuando el item trae una', () => {
    const [item] = adaptMotorsportItems([{ ...base, category: ['Moto2'] }]);

    expect(item?.category).toBe('Moto2');
  });
});

describe('createMotorsportProvider', () => {
  it('descarga el feed con timeout y lo adapta', async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response(MOTORSPORT_FEED_XML));
    const provider = createMotorsportProvider({ requestTimeoutMs: 5000, fetchFn });

    const items = await provider.fetchFeed('https://example.com/motor.xml');

    expect(items).toHaveLength(2);
    expect(fetchFn).toHaveBeenCalledWith('https://example.com/motor.xml', { signal: expect.any(AbortSignal) });
  });

  it('convierte los fallos de red y los estados HTTP de error en NewsProviderError', async () => {
    const network = createMotorsportProvider({
      requestTimeoutMs: 5000,
      fetchFn: vi.fn().mockRejectedValue(new TypeError('fetch failed')),
    });
    const http = createMotorsportProvider({
      requestTimeoutMs: 5000,
      fetchFn: vi.fn().mockResolvedValue(new Response('', { status: 503 })),
    });

    await expect(network.fetchFeed('https://example.com')).rejects.toThrow(NewsProviderError);
    await expect(http.fetchFeed('https://example.com')).rejects.toThrow(/HTTP 503/);
  });
});
