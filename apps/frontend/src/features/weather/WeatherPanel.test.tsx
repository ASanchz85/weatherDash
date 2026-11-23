import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { WEATHER_RETRY_INTERVAL_MS } from '../../config';
import { fetchWeather, WeatherApiError } from '../../services/weatherApi';
import { buildWeatherData } from '../../test/weatherFixtures';
import { WeatherPanel } from './WeatherPanel';

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

describe('WeatherPanel', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-23T12:00:00+01:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
    fetchWeatherMock.mockReset();
  });

  it('muestra el estado de carga mientras espera la primera respuesta', () => {
    fetchWeatherMock.mockReturnValue(new Promise(() => undefined));
    render(<WeatherPanel />);

    expect(screen.getByText('Cargando meteorología…')).toBeInTheDocument();
  });

  it('muestra la información meteorológica', async () => {
    fetchWeatherMock.mockResolvedValue(buildWeatherData());
    render(<WeatherPanel />);
    await flushPromises();

    expect(screen.getByRole('heading', { name: 'Navaluenga' })).toBeInTheDocument();
    expect(screen.getByText('Parcialmente nuboso')).toBeInTheDocument();
    expect(screen.getByText('8°')).toBeInTheDocument();
    expect(screen.getByText('Máx 12°')).toBeInTheDocument();
    expect(screen.getByText('Mín 1°')).toBeInTheDocument();
    expect(screen.getByText('6°')).toBeInTheDocument();
    expect(screen.getByText('72%')).toBeInTheDocument();
    expect(screen.getByText('13 km/h')).toBeInTheDocument();
    expect(screen.getByText('10%')).toBeInTheDocument();
    expect(screen.getByText('11:45')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('muestra un error controlado si no hay datos disponibles', async () => {
    fetchWeatherMock.mockRejectedValue(
      new WeatherApiError('La información meteorológica no está disponible'),
    );
    render(<WeatherPanel />);
    await flushPromises();

    expect(screen.getByRole('alert')).toHaveTextContent('Meteorología no disponible');
    expect(screen.getByRole('alert')).toHaveTextContent(
      'La información meteorológica no está disponible',
    );
  });

  it('indica cuando el backend devuelve información desactualizada', async () => {
    fetchWeatherMock.mockResolvedValue(buildWeatherData({ stale: true }));
    render(<WeatherPanel />);
    await flushPromises();

    expect(screen.getByRole('status')).toHaveTextContent('Datos desactualizados');
  });

  it('conserva los últimos datos si falla una actualización y reintenta', async () => {
    fetchWeatherMock
      .mockResolvedValueOnce(buildWeatherData())
      .mockRejectedValueOnce(new WeatherApiError('No se pudo conectar con el servidor local'))
      .mockResolvedValueOnce(buildWeatherData({ updatedAt: '2026-11-23T11:00:00.000Z' }));
    render(<WeatherPanel />);
    await flushPromises();

    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });
    expect(screen.getByText('Parcialmente nuboso')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Sin conexión con el servidor');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(WEATHER_RETRY_INTERVAL_MS);
    });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByText('12:00')).toBeInTheDocument();
    expect(fetchWeatherMock).toHaveBeenCalledTimes(3);
  });
});
