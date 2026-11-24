import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { buildWeatherData } from '../../test/weatherFixtures';
import { WeatherPanel } from './WeatherPanel';

describe('WeatherPanel', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-23T12:00:00+01:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('muestra el estado de carga mientras espera la primera respuesta', () => {
    render(<WeatherPanel state={{ status: 'loading' }} />);

    expect(screen.getByText('Cargando meteorología…')).toBeInTheDocument();
  });

  it('muestra la información meteorológica', () => {
    render(<WeatherPanel state={{ status: 'ready', data: buildWeatherData(), refreshFailed: false }} />);

    expect(screen.getByRole('heading', { name: 'Navaluenga' })).toBeInTheDocument();
    expect(screen.getByText('Parcialmente nuboso')).toBeInTheDocument();
    expect(screen.getByText('8°')).toBeInTheDocument();
    expect(screen.getByText('Máx', { exact: false })).toHaveTextContent('Máx 12°');
    expect(screen.getByText('Mín', { exact: false })).toHaveTextContent('Mín 1°');
    expect(screen.getByText('6°')).toBeInTheDocument();
    expect(screen.getByText('72%')).toBeInTheDocument();
    expect(screen.getByText('13 km/h')).toBeInTheDocument();
    expect(screen.getByText('10%')).toBeInTheDocument();
    expect(screen.getByText('11:45')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('muestra la hora del amanecer y del atardecer, o un guion si no existen', () => {
    const { rerender } = render(
      <WeatherPanel state={{ status: 'ready', data: buildWeatherData(), refreshFailed: false }} />,
    );
    expect(screen.getByText('Amanecer')).toBeInTheDocument();
    expect(screen.getByText('08:11')).toBeInTheDocument();
    expect(screen.getByText('17:49')).toBeInTheDocument();

    const data = buildWeatherData();
    rerender(
      <WeatherPanel
        state={{
          status: 'ready',
          data: { ...data, daily: { ...data.daily, sunrise: null, sunset: null } },
          refreshFailed: false,
        }}
      />,
    );
    expect(screen.queryByText('08:11')).not.toBeInTheDocument();
    expect(screen.getAllByText('—')).toHaveLength(2);
  });

  it('muestra un error controlado si no hay datos disponibles', () => {
    render(
      <WeatherPanel
        state={{ status: 'error', message: 'La información meteorológica no está disponible' }}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Meteorología no disponible');
    expect(screen.getByRole('alert')).toHaveTextContent(
      'La información meteorológica no está disponible',
    );
  });

  it('indica cuando el backend devuelve información desactualizada', () => {
    render(
      <WeatherPanel
        state={{ status: 'ready', data: buildWeatherData({ stale: true }), refreshFailed: false }}
      />,
    );

    expect(screen.getByRole('status')).toHaveTextContent('Datos desactualizados');
  });

  it('indica cuando falla la última consulta y se muestran los datos anteriores', () => {
    render(<WeatherPanel state={{ status: 'ready', data: buildWeatherData(), refreshFailed: true }} />);

    expect(screen.getByText('Parcialmente nuboso')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Sin conexión con el servidor');
  });
});
