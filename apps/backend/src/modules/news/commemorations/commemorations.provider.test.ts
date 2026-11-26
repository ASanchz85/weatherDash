import { describe, expect, it, vi } from 'vitest';

import { NewsProviderError } from '../news.http.js';
import { createCommemorationsProvider } from './commemorations.provider.js';

const TEMPLATE = 'https://es.wikipedia.org/api/rest_v1/feed/onthisday/events/{MM}/{DD}';
// 26-nov-2026 00:30 en Madrid (UTC+1), todavía 25-nov en UTC.
const NOW = Date.UTC(2026, 10, 25, 23, 30);

const payload = {
  events: [
    {
      year: 2003,
      text: 'el avión Concorde realiza el último de sus vuelos',
      pages: [
        {
          type: 'standard',
          content_urls: { desktop: { page: 'https://es.wikipedia.org/wiki/Concorde' } },
          originalimage: {
            source: 'https://upload.wikimedia.org/wikipedia/commons/e/eb/Concorde.jpg',
            width: 1024,
            height: 679,
          },
        },
      ],
    },
  ],
};

function respond(body: string, status = 200) {
  return vi.fn(async (_url: string | URL | Request, _init?: RequestInit) => new Response(body, { status }));
}

function provider(fetchFn: ReturnType<typeof respond>) {
  return createCommemorationsProvider({ requestTimeoutMs: 1000, fetchFn, timeZone: 'Europe/Madrid', now: () => NOW });
}

describe('createCommemorationsProvider', () => {
  it('consulta el día local, se identifica y devuelve las efemérides de hoy', async () => {
    const fetchFn = respond(JSON.stringify(payload));

    const items = await provider(fetchFn).fetchFeed(TEMPLATE);

    expect(fetchFn.mock.calls[0]?.[0]).toBe('https://es.wikipedia.org/api/rest_v1/feed/onthisday/events/11/26');
    expect(fetchFn.mock.calls[0]?.[1]?.headers).toMatchObject({ 'User-Agent': expect.stringContaining('WeatherDash') });
    expect(items).toEqual([
      expect.objectContaining({
        category: '26 de noviembre de 2003',
        publishedAt: Date.UTC(2026, 10, 25, 23),
      }),
    ]);
  });

  it('falla con un JSON no válido', async () => {
    await expect(provider(respond('<html>')).fetchFeed(TEMPLATE)).rejects.toBeInstanceOf(NewsProviderError);
  });

  it('falla si la respuesta no trae la lista de eventos', async () => {
    await expect(provider(respond('{"births":[]}')).fetchFeed(TEMPLATE)).rejects.toBeInstanceOf(NewsProviderError);
  });

  it('falla con un estado HTTP de error', async () => {
    await expect(provider(respond('', 503)).fetchFeed(TEMPLATE)).rejects.toBeInstanceOf(NewsProviderError);
  });
});
