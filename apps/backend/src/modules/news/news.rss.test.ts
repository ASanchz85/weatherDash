import { describe, expect, it, vi } from 'vitest';

import { NewsProviderError } from './news.http.js';
import { defineRssSource } from './news.rss.js';

const XML = `<rss version="2.0"><channel>
  <item><title>2026</title><category>Uno</category></item>
</channel></rss>`;

function captureRawItems() {
  const adapt = vi.fn().mockReturnValue([]);
  return { adapt, source: (arrayTags?: string[]) => defineRssSource({ ...(arrayTags && { arrayTags }), adapt }) };
}

describe('defineRssSource', () => {
  it('entrega los item como lista y mantiene todo el texto sin convertir', () => {
    const { adapt, source } = captureRawItems();

    source().parseFeed(XML);

    expect(adapt).toHaveBeenCalledWith([{ title: '2026', category: 'Uno' }]);
  });

  it('lee como lista solo las etiquetas que declara cada fuente', () => {
    const { adapt, source } = captureRawItems();

    source(['category']).parseFeed(XML);
    source().parseFeed(XML);

    expect(adapt).toHaveBeenNthCalledWith(1, [{ title: '2026', category: ['Uno'] }]);
    expect(adapt).toHaveBeenNthCalledWith(2, [{ title: '2026', category: 'Uno' }]);
  });

  it('acepta un canal sin noticias', () => {
    const { adapt, source } = captureRawItems();

    source().parseFeed('<rss version="2.0"><channel><title>Vacío</title></channel></rss>');

    expect(adapt).toHaveBeenCalledWith([]);
  });

  it('devuelve lo que adapta la fuente', () => {
    const items = [{ title: 'T' }];
    const parse = defineRssSource({ adapt: () => items as never }).parseFeed;

    expect(parse(XML)).toBe(items);
  });

  it('rechaza documentos que no son un RSS', () => {
    const { source } = captureRawItems();

    expect(() => source().parseFeed('<html><body>Error</body></html>')).toThrow(NewsProviderError);
    expect(() => source().parseFeed('<html><body>Error</body></html>')).toThrow(/formato inesperado/);
  });

  it('el proveedor descarga con timeout y convierte los fallos en NewsProviderError', async () => {
    const { source } = captureRawItems();
    const fetchFn = vi.fn().mockResolvedValue(new Response(XML));

    await source().createProvider({ requestTimeoutMs: 5000, fetchFn }).fetchFeed('https://example.com/feed.xml');
    const failing = source().createProvider({
      requestTimeoutMs: 5000,
      fetchFn: vi.fn().mockResolvedValue(new Response('', { status: 502 })),
    });

    expect(fetchFn).toHaveBeenCalledWith('https://example.com/feed.xml', { signal: expect.any(AbortSignal) });
    await expect(failing.fetchFeed('https://example.com')).rejects.toThrow(/HTTP 502/);
  });
});
