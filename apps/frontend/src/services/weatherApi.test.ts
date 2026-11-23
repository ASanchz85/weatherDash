import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildWeatherData } from '../test/weatherFixtures';
import { fetchWeather, parseWeatherData, WeatherApiError } from './weatherApi';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('parseWeatherData', () => {
  it('acepta una respuesta válida de la API local', () => {
    const data = buildWeatherData();
    expect(parseWeatherData(JSON.parse(JSON.stringify(data)))).toEqual(data);
  });

  it('rechaza respuestas con formato inesperado', () => {
    expect(() => parseWeatherData(null)).toThrow(WeatherApiError);
    expect(() => parseWeatherData({ ...buildWeatherData(), stale: 'no' })).toThrow(WeatherApiError);
    expect(() =>
      parseWeatherData({
        ...buildWeatherData(),
        current: { ...buildWeatherData().current, icon: 'tornado' },
      }),
    ).toThrow(WeatherApiError);
  });
});

describe('fetchWeather', () => {
  it('consulta exclusivamente la API local', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json(buildWeatherData()));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchWeather()).resolves.toEqual(buildWeatherData());
    expect(fetchMock).toHaveBeenCalledWith('/api/weather', expect.anything());
  });

  it('traduce un 503 a un mensaje comprensible', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({}, { status: 503 })));
    await expect(fetchWeather()).rejects.toThrow('La información meteorológica no está disponible');
  });

  it('informa de los errores de conexión', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(fetchWeather()).rejects.toThrow('No se pudo conectar con el servidor local');
  });
});
