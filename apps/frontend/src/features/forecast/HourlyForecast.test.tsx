import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { buildHourly, buildWeatherData } from '../../test/weatherFixtures';
import type { WeatherState } from '../dashboard/useDashboardData';
import { HourlyForecast } from './HourlyForecast';

function ready(overrides: Parameters<typeof buildWeatherData>[0] = {}): WeatherState {
  return { status: 'ready', data: buildWeatherData(overrides), refreshFailed: false };
}

describe('HourlyForecast', () => {
  it('muestra el estado de carga', () => {
    render(<HourlyForecast state={{ status: 'loading' }} />);

    expect(screen.getByText('Cargando próximas horas…')).toBeInTheDocument();
  });

  it('muestra un aviso sin usar role=alert si no hay datos', () => {
    render(<HourlyForecast state={{ status: 'error', message: 'Error' }} />);

    expect(screen.getByRole('status')).toHaveTextContent('Próximas horas no disponibles');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('describe la gráfica de forma accesible con el rango de temperaturas', () => {
    render(<HourlyForecast state={ready()} />);

    expect(
      screen.getByRole('img', {
        name: 'Temperatura y probabilidad de lluvia de las próximas 24 horas, de 2° a 9°',
      }),
    ).toBeInTheDocument();
  });

  it('rotula la hora actual y una de cada tres con su temperatura', () => {
    render(<HourlyForecast state={ready()} />);

    expect(screen.getByText('Ahora')).toBeInTheDocument();
    expect(screen.getByText('21:00')).toBeInTheDocument();
    expect(screen.getByText('00:00')).toBeInTheDocument();
    expect(screen.queryByText('19:00')).not.toBeInTheDocument();
    // Una etiqueta de temperatura por cada hora rotulada: 24 horas / 3 = 8.
    expect(screen.getAllByTestId('hourly-temperature')).toHaveLength(8);
  });

  it('dibuja una barra por hora con la altura proporcional a la probabilidad de lluvia', () => {
    const hourly = buildHourly().map((hour, index) => ({
      ...hour,
      precipitationProbability: index === 1 ? 100 : index === 2 ? 50 : 0,
    }));
    render(<HourlyForecast state={ready({ hourly })} />);

    const bars = screen.getAllByTestId<HTMLElement>('hourly-bar');
    expect(bars).toHaveLength(24);
    expect(bars[0]!.style.height).toBe('0%');
    expect(bars[1]!.style.height).toBe('36%');
    expect(bars[2]!.style.height).toBe('18%');
  });

  it('no resalta las horas soleadas ni muestra el sol en la leyenda', () => {
    render(<HourlyForecast state={ready()} />);

    const slots = screen.getAllByTestId('hourly-slot');
    expect(slots).toHaveLength(24);
    expect(slots.every((slot) => !slot.hasAttribute('data-tone'))).toBe(true);
    expect(screen.queryByText('Sol')).not.toBeInTheDocument();
  });

  it('colorea la temperatura de cada hora rotulada según su tramo', () => {
    const hourly = buildHourly().map((hour, index) => ({ ...hour, temperature: index === 0 ? 31 : index === 3 ? -1 : 18 }));
    render(<HourlyForecast state={ready({ hourly })} />);

    const labels = screen.getAllByTestId('hourly-temperature');
    expect(labels[0]).toHaveAttribute('data-temperature-tone', 'warm');
    expect(labels[1]).toHaveAttribute('data-temperature-tone', 'freezing');
    expect(labels[2]).toHaveAttribute('data-temperature-tone', 'neutral');
    expect(labels[2]).not.toHaveAttribute('style');
  });

  it('explica los colores en la leyenda', () => {
    render(<HourlyForecast state={ready()} />);

    expect(screen.getByText('Temperatura')).toBeInTheDocument();
    expect(screen.getByText('Lluvia')).toBeInTheDocument();
  });

  it('corta la línea en los huecos de datos', () => {
    const hourly = buildHourly().map((hour, index) => (index === 5 ? { ...hour, temperature: null } : hour));
    const { container } = render(<HourlyForecast state={ready({ hourly })} />);

    expect(container.querySelectorAll('polyline')).toHaveLength(2);
  });

  it('funciona si todas las probabilidades y temperaturas faltan', () => {
    const hourly = buildHourly().map((hour) => ({ ...hour, temperature: null, precipitationProbability: null }));
    const { container } = render(<HourlyForecast state={ready({ hourly })} />);

    expect(screen.getByRole('img', { name: 'Probabilidad de lluvia de las próximas 24 horas' })).toBeInTheDocument();
    expect(container.querySelectorAll('polyline')).toHaveLength(0);
  });

  it('indica cuando no hay datos horarios', () => {
    render(<HourlyForecast state={ready({ hourly: [] })} />);

    expect(screen.getByRole('status')).toHaveTextContent('Sin datos horarios');
  });

  it('conserva la gráfica si falla una actualización', () => {
    render(<HourlyForecast state={{ status: 'ready', data: buildWeatherData(), refreshFailed: true }} />);

    expect(screen.getByText('Ahora')).toBeInTheDocument();
  });
});
