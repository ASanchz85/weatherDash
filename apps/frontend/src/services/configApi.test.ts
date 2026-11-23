import { afterEach, describe, expect, it, vi } from 'vitest';

import { ConfigApiError, fetchUiConfig, parseUiConfig } from './configApi';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('parseUiConfig', () => {
  it('acepta un intervalo válido, incluido 0 (rotación desactivada)', () => {
    expect(parseUiConfig({ rotationIntervalMs: 300000 })).toEqual({ rotationIntervalMs: 300000 });
    expect(parseUiConfig({ rotationIntervalMs: 0 })).toEqual({ rotationIntervalMs: 0 });
  });

  it('rechaza formatos inesperados', () => {
    expect(() => parseUiConfig(null)).toThrow(ConfigApiError);
    expect(() => parseUiConfig({})).toThrow(ConfigApiError);
    expect(() => parseUiConfig({ rotationIntervalMs: '300000' })).toThrow(ConfigApiError);
    expect(() => parseUiConfig({ rotationIntervalMs: -1 })).toThrow(ConfigApiError);
  });
});

describe('fetchUiConfig', () => {
  it('consulta exclusivamente la API local', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ rotationIntervalMs: 60000 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchUiConfig()).resolves.toEqual({ rotationIntervalMs: 60000 });
    expect(fetchMock).toHaveBeenCalledWith('/api/config', expect.anything());
  });

  it('informa de los errores de conexión y de servidor', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(fetchUiConfig()).rejects.toThrow('No se pudo conectar con el servidor local');

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({}, { status: 500 })));
    await expect(fetchUiConfig()).rejects.toThrow('Error del servidor (500)');
  });
});
