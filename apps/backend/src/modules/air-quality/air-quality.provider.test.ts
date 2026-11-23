import { describe, expect, it, vi } from 'vitest';

import { airQualityResponse, buildAirQuality, jsonResponse, navaluenga } from '../../test/fixtures.js';
import { createOpenMeteoAirQualityProvider, normalizeAirQuality } from './air-quality.provider.js';
import { airQualityResponseSchema } from './air-quality.schema.js';

describe('normalizeAirQuality', () => {
  it('transforma la respuesta de Open-Meteo al modelo interno', () => {
    expect(normalizeAirQuality(airQualityResponse)).toEqual(buildAirQuality());
  });

  it('conserva los valores positivos de polen', () => {
    const snapshot = normalizeAirQuality({
      current: { ...airQualityResponse.current, olive_pollen: 35.5, grass_pollen: 4 },
    });

    expect(snapshot.pollen).toEqual({ olive: 35.5, grass: 4 });
  });

  it('usa null cuando el proveedor no cubre el polen o faltan medidas', () => {
    const snapshot = normalizeAirQuality({
      current: { european_aqi: 40, pm2_5: 15.7, dust: 0, uv_index: null, olive_pollen: null, grass_pollen: null },
    });

    expect(snapshot).toEqual({
      europeanAqi: 40,
      pm25: 15.7,
      dust: 0,
      uvIndex: null,
      pollen: { olive: null, grass: null },
    });
  });

  it('tolera que falten campos enteros en la respuesta', () => {
    expect(airQualityResponseSchema.safeParse({ current: {} }).success).toBe(true);
    expect(normalizeAirQuality({ current: {} })).toEqual({
      europeanAqi: null,
      pm25: null,
      dust: null,
      uvIndex: null,
      pollen: { olive: null, grass: null },
    });
  });
});

describe('airQualityResponseSchema', () => {
  it('rechaza respuestas sin bloque current o con medidas no válidas', () => {
    expect(airQualityResponseSchema.safeParse({}).success).toBe(false);
    expect(airQualityResponseSchema.safeParse({ current: { pm2_5: '3.3' } }).success).toBe(false);
    expect(airQualityResponseSchema.safeParse({ current: { pm2_5: -1 } }).success).toBe(false);
  });
});

describe('createOpenMeteoAirQualityProvider', () => {
  it('consulta la API de calidad del aire con los parámetros esperados', async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse(airQualityResponse));
    const provider = createOpenMeteoAirQualityProvider({ requestTimeoutMs: 1000, fetchFn });

    const snapshot = await provider.fetchAirQuality(navaluenga);

    const url = new URL(String(fetchFn.mock.calls[0]?.[0]));
    expect(url.origin + url.pathname).toBe('https://air-quality-api.open-meteo.com/v1/air-quality');
    expect(url.searchParams.get('latitude')).toBe('40.41123');
    expect(url.searchParams.get('timezone')).toBe('Europe/Madrid');
    expect(url.searchParams.get('current')).toBe(
      'european_aqi,pm2_5,dust,uv_index,olive_pollen,grass_pollen',
    );
    expect(snapshot).toEqual(buildAirQuality());
  });

  it('lanza un error ante un fallo HTTP o datos con formato inesperado', async () => {
    const failing = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({}, 500));
    await expect(
      createOpenMeteoAirQualityProvider({ requestTimeoutMs: 1000, fetchFn: failing }).fetchAirQuality(navaluenga),
    ).rejects.toThrow(/estado HTTP 500/);

    const invalid = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({ current: { pm2_5: 'x' } }));
    await expect(
      createOpenMeteoAirQualityProvider({ requestTimeoutMs: 1000, fetchFn: invalid }).fetchAirQuality(navaluenga),
    ).rejects.toThrow(/formato inesperado/);
  });
});
