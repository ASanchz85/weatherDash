import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { buildWeatherData } from '../../test/weatherFixtures';
import { WeeklyForecast } from './WeeklyForecast';

describe('WeeklyForecast', () => {
  it('muestra el estado de carga', () => {
    render(<WeeklyForecast state={{ status: 'loading' }} />);

    expect(screen.getByText('Cargando predicción…')).toBeInTheDocument();
  });

  it('muestra un aviso sin usar role=alert si no hay datos', () => {
    render(<WeeklyForecast state={{ status: 'error', message: 'Error' }} />);

    expect(screen.getByRole('status')).toHaveTextContent('Predicción no disponible');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('muestra los siete días, con «Hoy» en el primero', () => {
    render(<WeeklyForecast state={{ status: 'ready', data: buildWeatherData(), refreshFailed: false }} />);

    const days = screen.getAllByRole('listitem');
    expect(days).toHaveLength(7);
    expect(within(days[0]!).getByText('Hoy')).toBeInTheDocument();
    expect(within(days[1]!).getByText('Mar')).toBeInTheDocument();
    expect(within(days[6]!).getByText('Dom')).toBeInTheDocument();
  });

  it('muestra icono accesible, temperaturas y probabilidad de lluvia de cada día', () => {
    render(<WeeklyForecast state={{ status: 'ready', data: buildWeatherData(), refreshFailed: false }} />);

    const tomorrow = screen.getAllByRole('listitem')[1]!;
    expect(within(tomorrow).getByText('Lluvia ligera')).toBeInTheDocument();
    expect(within(tomorrow).getByText('11°')).toBeInTheDocument();
    expect(within(tomorrow).getByText('2°')).toBeInTheDocument();
    expect(within(tomorrow).getByText('65%')).toBeInTheDocument();
  });

  it('destaca en azul los iconos de los días con lluvia y en naranja los soleados', () => {
    const { container } = render(
      <WeeklyForecast state={{ status: 'ready', data: buildWeatherData(), refreshFailed: false }} />,
    );

    const tones = [...container.querySelectorAll('svg[data-tone]')].map((icon) => icon.getAttribute('data-tone'));
    expect(tones).toEqual(['neutral', 'rain', 'neutral', 'sun', 'sun', 'neutral', 'neutral']);
  });

  it('colorea las temperaturas según su tramo y deja en blanco las intermedias', () => {
    const data = buildWeatherData();
    const [first, ...rest] = data.forecast;
    data.forecast = [{ ...first!, temperatureMax: 38, temperatureMin: -2 }, ...rest];
    render(<WeeklyForecast state={{ status: 'ready', data, refreshFailed: false }} />);

    const today = screen.getAllByRole('listitem')[0]!;
    expect(within(today).getByText('38°')).toHaveAttribute('data-temperature-tone', 'hot');
    expect(within(today).getByText('-2°')).toHaveAttribute('data-temperature-tone', 'freezing');
    // 11° de máxima el día siguiente cae en el tramo azul; 2° de mínima, en el azul oscuro.
    const tomorrow = screen.getAllByRole('listitem')[1]!;
    expect(within(tomorrow).getByText('11°')).toHaveAttribute('data-temperature-tone', 'cool');
    expect(within(tomorrow).getByText('2°')).toHaveAttribute('data-temperature-tone', 'cold');
  });

  it('muestra «—» cuando faltan valores', () => {
    const data = buildWeatherData();
    const [first, ...rest] = data.forecast;
    data.forecast = [
      { ...first!, temperatureMax: null, temperatureMin: null, precipitationProbabilityMax: null },
      ...rest,
    ];
    render(<WeeklyForecast state={{ status: 'ready', data, refreshFailed: false }} />);

    expect(within(screen.getAllByRole('listitem')[0]!).getAllByText('—')).toHaveLength(3);
  });

  it('conserva la predicción si falla una actualización', () => {
    render(<WeeklyForecast state={{ status: 'ready', data: buildWeatherData(), refreshFailed: true }} />);

    expect(screen.getAllByRole('listitem')).toHaveLength(7);
  });
});
