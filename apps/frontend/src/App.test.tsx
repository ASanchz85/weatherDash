import { act, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { App } from './App';
import { fetchAirQuality } from './services/airQualityApi';
import { fetchUiConfig } from './services/configApi';
import { fetchWeather, WeatherApiError } from './services/weatherApi';
import { buildAirQualityData, buildWeatherData } from './test/weatherFixtures';

vi.mock('./services/weatherApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./services/weatherApi')>()),
  fetchWeather: vi.fn(),
}));

vi.mock('./services/airQualityApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./services/airQualityApi')>()),
  fetchAirQuality: vi.fn(),
}));

vi.mock('./services/configApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./services/configApi')>()),
  fetchUiConfig: vi.fn(),
}));

beforeEach(() => {
  vi.mocked(fetchUiConfig).mockResolvedValue({ rotationIntervalMs: 0 });
  vi.mocked(fetchAirQuality).mockResolvedValue(buildAirQualityData());
});

afterEach(() => {
  vi.mocked(fetchWeather).mockReset();
  vi.mocked(fetchAirQuality).mockReset();
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

  describe('vistas rotatorias', () => {
    afterEach(() => {
      window.history.replaceState(null, '', '/');
    });

    async function renderApp() {
      render(<App />);
      await act(async () => {
        await Promise.resolve();
      });
      return screen.getByRole('complementary', { name: 'Meteorología' });
    }

    it('muestra el tiempo actual en la card lateral por defecto', async () => {
      vi.mocked(fetchWeather).mockResolvedValue(buildWeatherData());
      const side = await renderApp();

      expect(within(side).getByText('Parcialmente nuboso')).toBeInTheDocument();
      expect(within(side).queryByText('Viento y calidad del aire')).not.toBeInTheDocument();
    });

    it('muestra viento y calidad del aire con ?page=1, con los datos ya cargados', async () => {
      window.history.replaceState(null, '', '/?page=1');
      vi.mocked(fetchWeather).mockResolvedValue(buildWeatherData());
      const side = await renderApp();

      expect(within(side).getByText('Viento y calidad del aire')).toBeInTheDocument();
      expect(within(side).getByRole('img', { name: 'Viento del E (90°)' })).toBeInTheDocument();
      expect(within(side).getByText('Razonable')).toBeInTheDocument();
      expect(fetchWeather).toHaveBeenCalledTimes(1);
      expect(fetchAirQuality).toHaveBeenCalledTimes(1);
    });
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
