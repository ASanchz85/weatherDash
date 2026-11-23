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

  it('acepta valores nulos en la predicción diaria', () => {
    const [first, ...rest] = buildWeatherData().forecast;
    const data = buildWeatherData({
      forecast: [
        { ...first!, temperatureMax: null, temperatureMin: null, precipitationProbabilityMax: null },
        ...rest,
      ],
    });
    expect(parseWeatherData(JSON.parse(JSON.stringify(data)))).toEqual(data);
  });

  it('rechaza una predicción diaria ausente o con formato inesperado', () => {
    const { forecast: _omitted, ...withoutForecast } = buildWeatherData();
    expect(() => parseWeatherData(withoutForecast)).toThrow(WeatherApiError);

    const [first, ...rest] = buildWeatherData().forecast;
    expect(() =>
      parseWeatherData({ ...buildWeatherData(), forecast: [{ ...first, date: '23/11/2026' }, ...rest] }),
    ).toThrow(WeatherApiError);
    expect(() =>
      parseWeatherData({ ...buildWeatherData(), forecast: [{ ...first, icon: 'tornado' }, ...rest] }),
    ).toThrow(WeatherApiError);
    expect(() =>
      parseWeatherData({ ...buildWeatherData(), forecast: [{ ...first, temperatureMax: '12' }, ...rest] }),
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
