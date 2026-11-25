import { afterEach, describe, expect, it, vi } from 'vitest';

import { ConfigApiError, fetchUiConfig, parsePinnedScreen, parseUiConfig } from './configApi';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('parseUiConfig', () => {
  it('acepta tiempos válidos, incluido 0 (rotación desactivada)', () => {
    expect(parseUiConfig({ rotationIntervalMs: 300000, newsItemDurationMs: 60000 })).toEqual({
      rotationIntervalMs: 300000,
      newsItemDurationMs: 60000,
    });
    expect(parseUiConfig({ rotationIntervalMs: 0, newsItemDurationMs: 60000 }).rotationIntervalMs).toBe(0);
  });

  it('rechaza formatos inesperados', () => {
    expect(() => parseUiConfig(null)).toThrow(ConfigApiError);
    expect(() => parseUiConfig({})).toThrow(ConfigApiError);
    expect(() => parseUiConfig({ rotationIntervalMs: 300000 })).toThrow(ConfigApiError);
    expect(() => parseUiConfig({ rotationIntervalMs: '300000', newsItemDurationMs: 60000 })).toThrow(ConfigApiError);
    expect(() => parseUiConfig({ rotationIntervalMs: -1, newsItemDurationMs: 60000 })).toThrow(ConfigApiError);
    expect(() => parseUiConfig({ rotationIntervalMs: 0, newsItemDurationMs: 0 })).toThrow(ConfigApiError);
  });
});

describe('parsePinnedScreen', () => {
  it('traduce weather-N a la página N-1 y news-<feed> al feed', () => {
    expect(parsePinnedScreen('weather-1')).toEqual({ page: 0, feed: null });
    expect(parsePinnedScreen('weather-2')).toEqual({ page: 1, feed: null });
    expect(parsePinnedScreen('news-economy')).toEqual({ page: null, feed: 'economy' });
    expect(parsePinnedScreen('news-markets')).toEqual({ page: null, feed: 'markets' });
  });

  it.each([null, undefined, 0, '0', '', 'weather-0', 'weather', 'news-deportes', 'slide'])(
    'ignora %j y muestra todas las pantallas',
    (value) => {
      expect(parsePinnedScreen(value)).toBeNull();
    },
  );
});

describe('parseUiConfig con pantalla fijada', () => {
  it('incluye la pantalla fijada y la omite si no hay o no es válida', () => {
    const times = { rotationIntervalMs: 300000, newsItemDurationMs: 60000 };

    expect(parseUiConfig({ ...times, pinnedScreen: 'news-economy' })).toEqual({
      ...times,
      pinnedScreen: { page: null, feed: 'economy' },
    });
    expect(parseUiConfig({ ...times, pinnedScreen: null })).toEqual(times);
    expect(parseUiConfig({ ...times, pinnedScreen: 'otra' })).toEqual(times);
  });
});

describe('fetchUiConfig', () => {
  it('consulta exclusivamente la API local', async () => {
    const body = { rotationIntervalMs: 60000, newsItemDurationMs: 30000 };
    const fetchMock = vi.fn().mockResolvedValue(Response.json(body));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchUiConfig()).resolves.toEqual(body);
    expect(fetchMock).toHaveBeenCalledWith('/api/config', expect.anything());
  });

  it('informa de los errores de conexión y de servidor', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(fetchUiConfig()).rejects.toThrow('No se pudo conectar con el servidor local');

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({}, { status: 500 })));
    await expect(fetchUiConfig()).rejects.toThrow('Error del servidor (500)');
  });
});
