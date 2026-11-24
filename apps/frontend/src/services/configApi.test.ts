import { afterEach, describe, expect, it, vi } from 'vitest';

import { ConfigApiError, fetchUiConfig, parseUiConfig } from './configApi';

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
