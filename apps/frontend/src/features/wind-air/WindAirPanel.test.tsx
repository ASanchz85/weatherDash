import { render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { AirQualityState, WeatherState } from '../dashboard/useDashboardData';
import { buildAirQualityData, buildWeatherData } from '../../test/weatherFixtures';
import { WindAirPanel } from './WindAirPanel';

const readyWeather: WeatherState = { status: 'ready', data: buildWeatherData(), refreshFailed: false };
const readyAirQuality: AirQualityState = {
  status: 'ready',
  data: buildAirQualityData(),
  refreshFailed: false,
};

function renderPanel(weather: WeatherState = readyWeather, airQuality: AirQualityState = readyAirQuality) {
  return render(<WindAirPanel weather={weather} airQuality={airQuality} />);
}

describe('WindAirPanel', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-23T12:00:00+01:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('muestra el viento con su rosa, rachas y dirección', () => {
    renderPanel();

    expect(screen.getByRole('heading', { name: 'Navaluenga' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Viento del E (90°)' })).toBeInTheDocument();
    const wind = screen.getByRole('region', { name: 'Viento' });
    expect(within(wind).getByText('13')).toBeInTheDocument();
    expect(within(wind).getByText('Dirección E')).toBeInTheDocument();
    expect(within(wind).getByText('Rachas 24 km/h')).toBeInTheDocument();
  });

  it('muestra la presión y la nubosidad', () => {
    renderPanel();

    expect(screen.getByText('1025 hPa')).toBeInTheDocument();
    expect(screen.getByText('96%')).toBeInTheDocument();
  });

  it('muestra la calidad del aire con su nivel y las demás medidas', () => {
    renderPanel();

    expect(screen.getByText('Calidad del aire')).toBeInTheDocument();
    expect(screen.getByText('22')).toBeInTheDocument();
    expect(screen.getByText('Razonable')).toBeInTheDocument();
    expect(screen.getByText('3,3 µg/m³')).toBeInTheDocument();
    expect(screen.getByText('Sin polen')).toBeInTheDocument();
    expect(screen.getByText('Índice UV')).toBeInTheDocument();
  });

  it('muestra el polen dominante cuando lo hay', () => {
    renderPanel(
      readyWeather,
      { status: 'ready', data: buildAirQualityData({ pollen: { olive: 35, grass: 4 } }), refreshFailed: false },
    );

    expect(screen.getByText('Olivo 35 gr/m³')).toBeInTheDocument();
  });

  it('usa marcadores si el proveedor no cubre el polen ni el índice', () => {
    renderPanel(
      readyWeather,
      {
        status: 'ready',
        data: buildAirQualityData({ europeanAqi: null, uvIndex: null, pollen: { olive: null, grass: null } }),
        refreshFailed: false,
      },
    );

    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(3);
    expect(screen.queryByText('Razonable')).not.toBeInTheDocument();
  });

  it('un fallo de la calidad del aire solo afecta a su bloque', () => {
    renderPanel(readyWeather, { status: 'error', message: 'La calidad del aire no está disponible' });

    expect(screen.getByText('Calidad del aire no disponible')).toBeInTheDocument();
    expect(screen.getByText('1025 hPa')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Viento del E (90°)' })).toBeInTheDocument();
  });

  it('muestra un estado de carga de la calidad del aire sin bloquear el viento', () => {
    renderPanel(readyWeather, { status: 'loading' });

    expect(screen.getByText('Cargando calidad del aire…')).toBeInTheDocument();
    expect(screen.getByText('1025 hPa')).toBeInTheDocument();
  });

  it('indica los datos desactualizados del tiempo o de la calidad del aire', () => {
    const { unmount } = renderPanel({ ...readyWeather, refreshFailed: true });
    expect(screen.getByRole('status')).toHaveTextContent('Sin conexión con el servidor');
    unmount();

    renderPanel(readyWeather, {
      status: 'ready',
      data: buildAirQualityData({ stale: true }),
      refreshFailed: false,
    });
    expect(screen.getByRole('status')).toHaveTextContent('Aire desactualizado');
  });

  it('muestra los estados de carga y error del tiempo', () => {
    const { unmount } = renderPanel({ status: 'loading' });
    expect(screen.getByText('Cargando viento y aire…')).toBeInTheDocument();
    unmount();

    renderPanel({ status: 'error', message: 'Sin conexión' });
    expect(screen.getByRole('alert')).toHaveTextContent('Viento y aire no disponibles');
  });
});
