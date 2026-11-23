import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DATA_RETRY_INTERVAL_MS, REFRESH_GRACE_MS } from '../../config';
import { AirQualityApiError, fetchAirQuality } from '../../services/airQualityApi';
import { fetchWeather, WeatherApiError } from '../../services/weatherApi';
import type { AirQualityData } from '../../types/airQuality';
import type { WeatherData } from '../../types/weather';
import { buildAirQualityData, buildWeatherData } from '../../test/weatherFixtures';
import { useDashboardData } from './useDashboardData';

vi.mock('../../services/weatherApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../services/weatherApi')>()),
  fetchWeather: vi.fn(),
}));

vi.mock('../../services/airQualityApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../services/airQualityApi')>()),
  fetchAirQuality: vi.fn(),
}));

const fetchWeatherMock = vi.mocked(fetchWeather);
const fetchAirQualityMock = vi.mocked(fetchAirQuality);

const WEATHER_REFRESH_IN_MS = 10 * 60 * 1000;

/** Resuelve las promesas pendientes del hook dentro de act(). */
async function flushPromises() {
  await act(async () => {
    await Promise.resolve();
  });
}

async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((onResolve, onReject) => {
    resolve = onResolve;
    reject = onReject;
  });
  return { promise, resolve, reject };
}

function weatherWithHint(overrides: Partial<WeatherData> = {}) {
  return buildWeatherData({ nextRefreshInMs: WEATHER_REFRESH_IN_MS, ...overrides });
}

describe('useDashboardData', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    fetchWeatherMock.mockResolvedValue(weatherWithHint());
    fetchAirQualityMock.mockResolvedValue(buildAirQualityData());
  });

  afterEach(() => {
    vi.useRealTimers();
    fetchWeatherMock.mockReset();
    fetchAirQualityMock.mockReset();
  });

  it('pide el tiempo y la calidad del aire a la vez al montar', () => {
    fetchWeatherMock.mockReturnValue(new Promise(() => undefined));
    fetchAirQualityMock.mockReturnValue(new Promise(() => undefined));

    const { result } = renderHook(() => useDashboardData());

    expect(result.current).toEqual({ weather: { status: 'loading' }, airQuality: { status: 'loading' } });
    expect(fetchWeatherMock).toHaveBeenCalledTimes(1);
    expect(fetchAirQualityMock).toHaveBeenCalledTimes(1);
  });

  it('expone los dos conjuntos de datos', async () => {
    const { result } = renderHook(() => useDashboardData());
    await flushPromises();

    expect(result.current).toEqual({
      weather: { status: 'ready', data: weatherWithHint(), refreshFailed: false },
      airQuality: { status: 'ready', data: buildAirQualityData(), refreshFailed: false },
    });
  });

  it('muestra el tiempo en cuanto llega, sin esperar a la calidad del aire', async () => {
    const airQuality = deferred<AirQualityData>();
    fetchAirQualityMock.mockReturnValue(airQuality.promise);

    const { result } = renderHook(() => useDashboardData());
    await flushPromises();

    expect(result.current.weather.status).toBe('ready');
    expect(result.current.airQuality.status).toBe('loading');
    expect(vi.getTimerCount()).toBe(0);

    airQuality.resolve(buildAirQualityData());
    await flushPromises();
    expect(result.current.airQuality.status).toBe('ready');
    expect(vi.getTimerCount()).toBe(1);
  });

  it('mantiene independientes los errores de cada fuente', async () => {
    fetchAirQualityMock.mockRejectedValue(new AirQualityApiError('La calidad del aire no está disponible'));

    const { result } = renderHook(() => useDashboardData());
    await flushPromises();

    expect(result.current.weather.status).toBe('ready');
    expect(result.current.airQuality).toEqual({
      status: 'error',
      message: 'La calidad del aire no está disponible',
    });
  });

  it('programa el siguiente ciclo con la pista del servidor más un margen', async () => {
    renderHook(() => useDashboardData());
    await flushPromises();

    await advance(WEATHER_REFRESH_IN_MS + REFRESH_GRACE_MS - 1);
    expect(fetchWeatherMock).toHaveBeenCalledTimes(1);

    await advance(1);
    expect(fetchWeatherMock).toHaveBeenCalledTimes(2);
    expect(fetchAirQualityMock).toHaveBeenCalledTimes(2);
  });

  it('conserva los últimos datos si falla una actualización y reintenta pronto', async () => {
    const updated = weatherWithHint({ updatedAt: '2026-11-23T11:00:00.000Z' });
    fetchWeatherMock
      .mockResolvedValueOnce(weatherWithHint())
      .mockRejectedValueOnce(new WeatherApiError('No se pudo conectar con el servidor local'))
      .mockResolvedValueOnce(updated);
    const { result } = renderHook(() => useDashboardData());
    await flushPromises();

    await advance(WEATHER_REFRESH_IN_MS + REFRESH_GRACE_MS);
    expect(result.current.weather).toEqual({ status: 'ready', data: weatherWithHint(), refreshFailed: true });

    await advance(DATA_RETRY_INTERVAL_MS);
    expect(result.current.weather).toEqual({ status: 'ready', data: updated, refreshFailed: false });
    expect(fetchWeatherMock).toHaveBeenCalledTimes(3);
  });

  it('reintenta pronto si solo falla la calidad del aire', async () => {
    fetchAirQualityMock
      .mockRejectedValueOnce(new AirQualityApiError('La calidad del aire no está disponible'))
      .mockResolvedValue(buildAirQualityData());
    const { result } = renderHook(() => useDashboardData());
    await flushPromises();
    expect(result.current.airQuality.status).toBe('error');

    await advance(DATA_RETRY_INTERVAL_MS);

    expect(result.current.airQuality.status).toBe('ready');
    expect(fetchAirQualityMock).toHaveBeenCalledTimes(2);
  });

  it('expone un error si la primera consulta del tiempo falla', async () => {
    fetchWeatherMock.mockRejectedValue(new WeatherApiError('La información meteorológica no está disponible'));
    const { result } = renderHook(() => useDashboardData());
    await flushPromises();

    expect(result.current.weather).toEqual({
      status: 'error',
      message: 'La información meteorológica no está disponible',
    });
  });

  it('mantiene un único temporizador y deja de consultar al desmontar', async () => {
    const { unmount } = renderHook(() => useDashboardData());
    await flushPromises();
    expect(vi.getTimerCount()).toBe(1);

    unmount();
    expect(vi.getTimerCount()).toBe(0);

    await vi.advanceTimersByTimeAsync(WEATHER_REFRESH_IN_MS * 2);
    expect(fetchWeatherMock).toHaveBeenCalledTimes(1);
    expect(fetchAirQualityMock).toHaveBeenCalledTimes(1);
  });
});
