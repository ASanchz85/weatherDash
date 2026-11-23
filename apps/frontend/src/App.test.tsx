import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { App } from './App';
import { fetchWeather, WeatherApiError } from './services/weatherApi';

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
});
