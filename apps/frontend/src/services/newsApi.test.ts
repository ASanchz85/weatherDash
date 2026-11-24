import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchNewsRotation, NewsApiError, parseNewsRotation, upscaleEnclosure } from './newsApi';

afterEach(() => {
  vi.unstubAllGlobals();
});

const apiItem = {
  id: 7,
  title: 'Titular',
  link: 'https://www.europapress.es/internacional/noticia-x.html',
  description: 'Descripción',
  enclosureUrl: 'https://img.europapress.es/fotoweb/fotonoticia_20261124083249_120.jpg',
  guid: 'x',
  publishedAt: '2026-11-24T07:32:49.000Z',
  category: 'Internacional',
};

describe('upscaleEnclosure', () => {
  it('sustituye el tamaño 120 por 800 al final del nombre', () => {
    expect(upscaleEnclosure('https://img.europapress.es/fotoweb/fotonoticia_20261124083249_120.jpg')).toBe(
      'https://img.europapress.es/fotoweb/fotonoticia_20261124083249_800.jpg',
    );
  });

  it('conserva la query y no toca otros números de la URL', () => {
    expect(upscaleEnclosure('https://img.example.com/120/foto_120.png?v=2')).toBe(
      'https://img.example.com/120/foto_800.png?v=2',
    );
  });

  it('deja intactas las URLs que no siguen el patrón', () => {
    expect(upscaleEnclosure('https://img.example.com/foto.jpg')).toBe('https://img.example.com/foto.jpg');
  });
});

describe('parseNewsRotation', () => {
  it('normaliza la noticia con la foto en alta resolución', () => {
    expect(parseNewsRotation({ feed: 'international', size: 5, items: [apiItem] })).toEqual({
      feed: 'international',
      size: 5,
      items: [
        {
          id: 7,
          title: 'Titular',
          description: 'Descripción',
          imageUrl: 'https://img.europapress.es/fotoweb/fotonoticia_20261124083249_800.jpg',
          publishedAt: '2026-11-24T07:32:49.000Z',
          category: 'Internacional',
        },
      ],
    });
  });

  it('acepta una rotación sin noticias', () => {
    expect(parseNewsRotation({ feed: 'markets', size: 5, items: [] })).toEqual({ feed: 'markets', size: 5, items: [] });
  });

  it('rechaza formatos inesperados', () => {
    expect(() => parseNewsRotation(null)).toThrow(NewsApiError);
    expect(() => parseNewsRotation({ feed: 'deportes', size: 5, items: [] })).toThrow(NewsApiError);
    expect(() => parseNewsRotation({ feed: 'national', items: [] })).toThrow(NewsApiError);
    expect(() => parseNewsRotation({ feed: 'national', size: 0, items: [] })).toThrow(NewsApiError);
    expect(() => parseNewsRotation({ feed: 'national', size: 2.5, items: [] })).toThrow(NewsApiError);
    expect(() => parseNewsRotation({ feed: 'national', size: 5, items: [{ ...apiItem, title: 3 }] })).toThrow(NewsApiError);
    expect(() => parseNewsRotation({ feed: 'national', size: 5, items: [{ ...apiItem, publishedAt: 'ayer' }] })).toThrow(
      NewsApiError,
    );
  });
});

describe('fetchNewsRotation', () => {
  it('pide la rotación con POST a la API local', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ feed: 'national', size: 5, items: [apiItem] }));
    vi.stubGlobal('fetch', fetchMock);

    const rotation = await fetchNewsRotation('national');

    expect(rotation.items).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledWith('/api/news/national/rotation', expect.objectContaining({ method: 'POST' }));
  });

  it('informa de los errores de conexión y de servidor', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(fetchNewsRotation('national')).rejects.toThrow('No se pudo conectar con el servidor local');

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({}, { status: 500 })));
    await expect(fetchNewsRotation('national')).rejects.toThrow('Error del servidor (500)');
  });
});
