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

  it('acepta el amanecer y el atardecer nulos y rechaza horas con formato inesperado', () => {
    const base = buildWeatherData();
    const withoutSun = buildWeatherData({ daily: { ...base.daily, sunrise: null, sunset: null } });
    expect(parseWeatherData(JSON.parse(JSON.stringify(withoutSun)))).toEqual(withoutSun);

    expect(() =>
      parseWeatherData({ ...base, daily: { ...base.daily, sunrise: '08:11' } }),
    ).toThrow(WeatherApiError);
    const { sunset: _omitted, ...dailyWithoutSunset } = base.daily;
    expect(() => parseWeatherData({ ...base, daily: dailyWithoutSunset })).toThrow(WeatherApiError);
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

  it('acepta valores nulos en el viento, la presión, la nubosidad y las horas', () => {
    const base = buildWeatherData();
    const [first, ...rest] = base.hourly;
    const data = buildWeatherData({
      current: { ...base.current, windDirection: null, windGusts: null, pressure: null, cloudCover: null },
      hourly: [{ ...first!, temperature: null, precipitationProbability: null }, ...rest],
    });

    expect(parseWeatherData(JSON.parse(JSON.stringify(data)))).toEqual(data);
  });

  it('rechaza medidas actuales ausentes o con tipo incorrecto', () => {
    const { windDirection: _omitted, ...currentWithoutDirection } = buildWeatherData().current;
    expect(() =>
      parseWeatherData({ ...buildWeatherData(), current: currentWithoutDirection }),
    ).toThrow(WeatherApiError);
    expect(() =>
      parseWeatherData({
        ...buildWeatherData(),
        current: { ...buildWeatherData().current, pressure: '1024' },
      }),
    ).toThrow(WeatherApiError);
  });

  it('rechaza una predicción horaria ausente o con formato inesperado', () => {
    const { hourly: _omitted, ...withoutHourly } = buildWeatherData();
    expect(() => parseWeatherData(withoutHourly)).toThrow(WeatherApiError);

    const [first, ...rest] = buildWeatherData().hourly;
    expect(() =>
      parseWeatherData({ ...buildWeatherData(), hourly: [{ ...first, time: '18:00' }, ...rest] }),
    ).toThrow(WeatherApiError);
    expect(() =>
      parseWeatherData({ ...buildWeatherData(), hourly: [{ ...first, temperature: '9' }, ...rest] }),
    ).toThrow(WeatherApiError);
    expect(() =>
      parseWeatherData({ ...buildWeatherData(), hourly: [{ ...first, icon: 'tornado' }, ...rest] }),
    ).toThrow(WeatherApiError);
    expect(() =>
      parseWeatherData({ ...buildWeatherData(), hourly: [{ ...first, isDay: 1 }, ...rest] }),
    ).toThrow(WeatherApiError);
    expect(() =>
      parseWeatherData({ ...buildWeatherData(), hourly: [{ ...first, weatherCode: '0' }, ...rest] }),
    ).toThrow(WeatherApiError);
  });

  it('exige una pista de refresco válida', () => {
    const { nextRefreshInMs: _omitted, ...withoutHint } = buildWeatherData();
    expect(() => parseWeatherData(withoutHint)).toThrow(WeatherApiError);
    expect(() => parseWeatherData({ ...buildWeatherData(), nextRefreshInMs: -1 })).toThrow(WeatherApiError);
    expect(() => parseWeatherData({ ...buildWeatherData(), nextRefreshInMs: '900000' })).toThrow(
      WeatherApiError,
    );
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
