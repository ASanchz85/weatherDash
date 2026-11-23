import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { WEATHER_POLL_INTERVAL_MS, WEATHER_RETRY_INTERVAL_MS } from '../../config';
import { fetchWeather, WeatherApiError } from '../../services/weatherApi';
import { buildWeatherData } from '../../test/weatherFixtures';
import { useWeather } from './useWeather';

vi.mock('../../services/weatherApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../services/weatherApi')>()),
  fetchWeather: vi.fn(),
}));

const fetchWeatherMock = vi.mocked(fetchWeather);

/** Resuelve las promesas pendientes del hook dentro de act(). */
async function flushPromises() {
  await act(async () => {
    await Promise.resolve();
  });
}

describe('useWeather', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    fetchWeatherMock.mockReset();
  });

  it('empieza en estado de carga', () => {
    fetchWeatherMock.mockReturnValue(new Promise(() => undefined));
    const { result } = renderHook(() => useWeather());

    expect(result.current).toEqual({ status: 'loading' });
  });

  it('expone los datos y vuelve a consultar con el intervalo de sondeo', async () => {
    fetchWeatherMock.mockResolvedValue(buildWeatherData());
    const { result } = renderHook(() => useWeather());
    await flushPromises();

    expect(result.current).toEqual({ status: 'ready', data: buildWeatherData(), refreshFailed: false });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(WEATHER_POLL_INTERVAL_MS);
    });
    expect(fetchWeatherMock).toHaveBeenCalledTimes(2);
  });

  it('expone un error si la primera consulta falla', async () => {
    fetchWeatherMock.mockRejectedValue(new WeatherApiError('No se pudo conectar con el servidor local'));
    const { result } = renderHook(() => useWeather());
    await flushPromises();

    expect(result.current).toEqual({ status: 'error', message: 'No se pudo conectar con el servidor local' });
  });

  it('conserva los últimos datos si falla una actualización y reintenta', async () => {
    const updated = buildWeatherData({ updatedAt: '2026-11-23T11:00:00.000Z' });
    fetchWeatherMock
      .mockResolvedValueOnce(buildWeatherData())
      .mockRejectedValueOnce(new WeatherApiError('No se pudo conectar con el servidor local'))
      .mockResolvedValueOnce(updated);
    const { result } = renderHook(() => useWeather());
    await flushPromises();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(WEATHER_POLL_INTERVAL_MS);
    });
    expect(result.current).toEqual({ status: 'ready', data: buildWeatherData(), refreshFailed: true });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(WEATHER_RETRY_INTERVAL_MS);
    });
    expect(result.current).toEqual({ status: 'ready', data: updated, refreshFailed: false });
    expect(fetchWeatherMock).toHaveBeenCalledTimes(3);
  });

  it('deja de consultar al desmontar', async () => {
    fetchWeatherMock.mockResolvedValue(buildWeatherData());
    const { unmount } = renderHook(() => useWeather());
    await flushPromises();
    unmount();

    await vi.advanceTimersByTimeAsync(WEATHER_POLL_INTERVAL_MS);
    expect(fetchWeatherMock).toHaveBeenCalledTimes(1);
  });
});
