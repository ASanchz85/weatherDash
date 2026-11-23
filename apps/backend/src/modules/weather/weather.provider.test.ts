import { describe, expect, it, vi } from 'vitest';

import {
  buildForecast,
  forecastResponse,
  geocodingResponse,
  jsonResponse,
  navaluenga,
} from '../../test/fixtures.js';
import { createOpenMeteoProvider, normalizeForecast, WeatherProviderError } from './weather.provider.js';
import { forecastResponseSchema } from './weather.schema.js';

function providerWith(fetchFn: typeof fetch) {
  return createOpenMeteoProvider({ requestTimeoutMs: 1000, fetchFn });
}

describe('normalizeForecast', () => {
  it('transforma la respuesta de Open-Meteo al modelo interno', () => {
    expect(normalizeForecast(forecastResponse, navaluenga)).toEqual({
      location: { name: 'Navaluenga', country: 'España' },
      current: {
        temperature: 8.4,
        apparentTemperature: 6.1,
        relativeHumidity: 72,
        windSpeed: 2.3,
        precipitationProbability: 10,
        weatherCode: 2,
        description: 'Parcialmente nuboso',
        icon: 'partly-cloudy',
        isDay: true,
      },
      daily: { temperatureMax: 11.9, temperatureMin: 0.8 },
      forecast: buildForecast(),
    });
  });

  it('usa null cuando faltan la probabilidad de precipitación o los extremos diarios', () => {
    const snapshot = normalizeForecast(
      {
        current: { ...forecastResponse.current, precipitation_probability: null, is_day: 0 },
        daily: {
          time: ['2026-11-23'],
          weather_code: [2],
          temperature_2m_max: [null],
          temperature_2m_min: [null],
          precipitation_probability_max: [null],
        },
      },
      navaluenga,
    );
    expect(snapshot.current.precipitationProbability).toBeNull();
    expect(snapshot.current.isDay).toBe(false);
    expect(snapshot.daily).toEqual({ temperatureMax: null, temperatureMin: null });
    expect(snapshot.forecast).toEqual([
      {
        date: '2026-11-23',
        weatherCode: 2,
        description: 'Parcialmente nuboso',
        icon: 'partly-cloudy',
        temperatureMax: null,
        temperatureMin: null,
        precipitationProbabilityMax: null,
      },
    ]);
  });

  it('interpreta cada día con su propio código meteorológico', () => {
    const { forecast } = normalizeForecast(forecastResponse, navaluenga);
    expect(forecast.map(({ icon }) => icon)).toEqual(['partly-cloudy', 'rain', 'cloudy']);
  });
});

describe('forecastResponseSchema', () => {
  it('acepta una respuesta válida', () => {
    expect(forecastResponseSchema.safeParse(forecastResponse).success).toBe(true);
  });

  it('rechaza campos obligatorios ausentes o con tipo incorrecto', () => {
    const { temperature_2m: _omitted, ...currentWithoutTemperature } = forecastResponse.current;
    expect(
      forecastResponseSchema.safeParse({ ...forecastResponse, current: currentWithoutTemperature }).success,
    ).toBe(false);
    expect(
      forecastResponseSchema.safeParse({
        ...forecastResponse,
        current: { ...forecastResponse.current, relative_humidity_2m: '72' },
      }).success,
    ).toBe(false);
  });

  it('rechaza series diarias de distinta longitud', () => {
    expect(
      forecastResponseSchema.safeParse({
        ...forecastResponse,
        daily: { ...forecastResponse.daily, weather_code: [2] },
      }).success,
    ).toBe(false);
  });

  it('rechaza fechas diarias con formato no ISO', () => {
    expect(
      forecastResponseSchema.safeParse({
        ...forecastResponse,
        daily: { ...forecastResponse.daily, time: ['23/11/2026', '24/11/2026', '25/11/2026'] },
      }).success,
    ).toBe(false);
  });
});

describe('createOpenMeteoProvider', () => {
  it('consulta la previsión con los parámetros esperados y normaliza el resultado', async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse(forecastResponse));
    const snapshot = await providerWith(fetchFn).fetchForecast(navaluenga);

    const url = new URL(String(fetchFn.mock.calls[0]?.[0]));
    expect(url.origin + url.pathname).toBe('https://api.open-meteo.com/v1/forecast');
    expect(url.searchParams.get('latitude')).toBe('40.41123');
    expect(url.searchParams.get('timezone')).toBe('Europe/Madrid');
    expect(url.searchParams.get('current')).toContain('precipitation_probability');
    expect(url.searchParams.get('forecast_days')).toBe('7');
    expect(url.searchParams.get('daily')).toBe(
      'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
    );
    expect(snapshot.current.description).toBe('Parcialmente nuboso');
    expect(snapshot.forecast).toHaveLength(3);
  });

  it('obtiene el primer resultado del geocoding', async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse(geocodingResponse));
    const place = await providerWith(fetchFn).geocode('Navaluenga', 'ES');

    const url = new URL(String(fetchFn.mock.calls[0]?.[0]));
    expect(url.searchParams.get('countryCode')).toBe('ES');
    expect(place).toEqual({
      name: 'Navaluenga',
      country: 'España',
      latitude: 40.41123,
      longitude: -4.70897,
      timezone: 'Europe/Madrid',
    });
  });

  it('devuelve null si el geocoding no encuentra resultados', async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({ generationtime_ms: 0.1 }));
    await expect(providerWith(fetchFn).geocode('Inexistente', null)).resolves.toBeNull();
  });

  it('lanza WeatherProviderError ante un error HTTP', async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({ reason: 'boom' }, 500));
    await expect(providerWith(fetchFn).fetchForecast(navaluenga)).rejects.toThrow(
      /estado HTTP 500/,
    );
  });

  it('lanza WeatherProviderError ante un error de red', async () => {
    const fetchFn = vi.fn<typeof fetch>().mockRejectedValue(new TypeError('fetch failed'));
    await expect(providerWith(fetchFn).fetchForecast(navaluenga)).rejects.toThrow(/error de red/);
  });

  it('lanza WeatherProviderError ante un timeout', async () => {
    const timeout = new DOMException('The operation timed out', 'TimeoutError');
    const fetchFn = vi.fn<typeof fetch>().mockRejectedValue(timeout);
    await expect(providerWith(fetchFn).fetchForecast(navaluenga)).rejects.toThrow(/timeout/);
  });

  it('lanza WeatherProviderError si los datos no superan la validación', async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({ current: {} }));
    const promise = providerWith(fetchFn).fetchForecast(navaluenga);
    await expect(promise).rejects.toBeInstanceOf(WeatherProviderError);
    await expect(promise).rejects.toThrow(/formato inesperado/);
  });
});
