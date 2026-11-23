import { act, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { App } from './App';
import { fetchWeather, WeatherApiError } from './services/weatherApi';
import { buildWeatherData } from './test/weatherFixtures';

vi.mock('./services/weatherApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./services/weatherApi')>()),
  fetchWeather: vi.fn(),
}));

afterEach(() => {
  vi.mocked(fetchWeather).mockReset();
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
});
