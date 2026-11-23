import { act, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { App } from './App';
import { fetchUiConfig } from './services/configApi';
import { fetchWeather, WeatherApiError } from './services/weatherApi';
import { buildWeatherData } from './test/weatherFixtures';

vi.mock('./services/weatherApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./services/weatherApi')>()),
  fetchWeather: vi.fn(),
}));

vi.mock('./services/configApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./services/configApi')>()),
  fetchUiConfig: vi.fn(),
}));

beforeEach(() => {
  vi.mocked(fetchUiConfig).mockResolvedValue({ rotationIntervalMs: 0 });
});

afterEach(() => {
  vi.mocked(fetchWeather).mockReset();
  vi.mocked(fetchUiConfig).mockReset();
});

describe('App', () => {
  it('muestra el reloj aunque la meteorología falle', async () => {
    vi.mocked(fetchWeather).mockRejectedValue(new WeatherApiError('No se pudo conectar con el servidor local'));
    render(<App />);
    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByRole('region', { name: 'Fecha y hora' })).toContainElement(
      screen.getByTestId('clock-seconds'),
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Meteorología no disponible');
  });

  it('muestra la predicción semanal con los datos de la API local', async () => {
    vi.mocked(fetchWeather).mockResolvedValue(buildWeatherData());
    render(<App />);
    await act(async () => {
      await Promise.resolve();
    });

    const forecast = screen.getByRole('region', { name: 'Predicción semanal' });
    expect(within(forecast).getAllByRole('listitem')).toHaveLength(7);
    expect(fetchWeather).toHaveBeenCalledTimes(1);
  });

  describe('tema del hero', () => {
    afterEach(() => {
      window.history.replaceState(null, '', '/');
    });

    async function renderApp() {
      render(<App />);
      await act(async () => {
        await Promise.resolve();
      });
      return screen.getByRole('region', { name: 'Fecha y hora' });
    }

    it('usa la foto de día mientras no hay datos', async () => {
      vi.mocked(fetchWeather).mockRejectedValue(new WeatherApiError('Sin conexión'));

      expect(await renderApp()).toHaveAttribute('data-theme', 'day');
    });

    it('usa la foto de noche cuando la meteorología indica que es de noche', async () => {
      const data = buildWeatherData();
      vi.mocked(fetchWeather).mockResolvedValue({ ...data, current: { ...data.current, isDay: false } });

      expect(await renderApp()).toHaveAttribute('data-theme', 'night');
    });

    it('permite forzar el tema con ?theme=', async () => {
      window.history.replaceState(null, '', '/?theme=night');
      vi.mocked(fetchWeather).mockResolvedValue(buildWeatherData());

      expect(await renderApp()).toHaveAttribute('data-theme', 'night');
    });
  });
});
