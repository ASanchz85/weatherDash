import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildAirQualityData } from '../test/weatherFixtures';
import { AirQualityApiError, fetchAirQuality, parseAirQualityData } from './airQualityApi';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('parseAirQualityData', () => {
  it('acepta una respuesta válida de la API local', () => {
    const data = buildAirQualityData();
    expect(parseAirQualityData(JSON.parse(JSON.stringify(data)))).toEqual(data);
  });

  it('acepta valores nulos, como el polen fuera de la cobertura del proveedor', () => {
    const data = buildAirQualityData({
      europeanAqi: null,
      uvIndex: null,
      pollen: { olive: null, grass: null },
    });
    expect(parseAirQualityData(JSON.parse(JSON.stringify(data)))).toEqual(data);
  });

  it('rechaza respuestas con formato inesperado', () => {
    expect(() => parseAirQualityData(null)).toThrow(AirQualityApiError);
    expect(() => parseAirQualityData({ ...buildAirQualityData(), stale: 'no' })).toThrow(AirQualityApiError);
    expect(() => parseAirQualityData({ ...buildAirQualityData(), pm25: '3.3' })).toThrow(AirQualityApiError);
    expect(() => parseAirQualityData({ ...buildAirQualityData(), pollen: null })).toThrow(AirQualityApiError);

    const { updatedAt: _omitted, ...withoutDate } = buildAirQualityData();
    expect(() => parseAirQualityData(withoutDate)).toThrow(AirQualityApiError);
  });
});

describe('fetchAirQuality', () => {
  it('consulta exclusivamente la API local', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json(buildAirQualityData()));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchAirQuality()).resolves.toEqual(buildAirQualityData());
    expect(fetchMock).toHaveBeenCalledWith('/api/air-quality', expect.anything());
  });

  it('traduce un 503 a un mensaje comprensible', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({}, { status: 503 })));
    await expect(fetchAirQuality()).rejects.toThrow('La calidad del aire no está disponible');
  });

  it('informa de los errores de conexión y de servidor', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(fetchAirQuality()).rejects.toThrow('No se pudo conectar con el servidor local');

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({}, { status: 500 })));
    await expect(fetchAirQuality()).rejects.toThrow('Error del servidor (500)');
  });
});
