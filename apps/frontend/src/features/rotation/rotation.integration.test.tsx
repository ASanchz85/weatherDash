import { act, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { App } from '../../App';
import { ROTATION_FADE_MS, SLIDE_DURATION_MS } from '../../config';
import { fetchAirQuality } from '../../services/airQualityApi';
import { fetchUiConfig } from '../../services/configApi';
import { fetchNewsRotation } from '../../services/newsApi';
import { fetchWeather } from '../../services/weatherApi';
import { buildNewsRotation } from '../../test/newsFixtures';
import { buildAirQualityData, buildWeatherData } from '../../test/weatherFixtures';

vi.mock('../../services/weatherApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../services/weatherApi')>()),
  fetchWeather: vi.fn(),
}));

vi.mock('../../services/airQualityApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../services/airQualityApi')>()),
  fetchAirQuality: vi.fn(),
}));

vi.mock('../../services/configApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../services/configApi')>()),
  fetchUiConfig: vi.fn(),
}));

vi.mock('../../services/newsApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../services/newsApi')>()),
  fetchNewsRotation: vi.fn(),
}));

const ROTATION_INTERVAL_MS = 10_000;
const NEWS_ITEM_MS = 60_000;

async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

/**
 * Avanza desde que la vista actual ya es visible hasta que termina su etapa y se muestra la siguiente.
 * Cada tramo va en su propio act para que React renderice y programe el siguiente temporizador.
 */
async function showNextStage(stageMs: number) {
  await advance(stageMs - ROTATION_FADE_MS);
  await advance(ROTATION_FADE_MS);
}

describe('rotación completa del dashboard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(fetchWeather).mockResolvedValue(buildWeatherData());
    vi.mocked(fetchAirQuality).mockResolvedValue(buildAirQualityData());
    vi.mocked(fetchUiConfig).mockResolvedValue({
      rotationIntervalMs: ROTATION_INTERVAL_MS,
      newsItemDurationMs: NEWS_ITEM_MS,
    });
    vi.mocked(fetchNewsRotation).mockImplementation(async (feed) => buildNewsRotation(feed));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.mocked(fetchWeather).mockReset();
    vi.mocked(fetchAirQuality).mockReset();
    vi.mocked(fetchUiConfig).mockReset();
    vi.mocked(fetchNewsRotation).mockReset();
  });

  it('alterna tiempo, diapositiva y noticias sin volver a consultar el tiempo', async () => {
    render(<App />);
    await advance(0);
    expect(screen.getByRole('region', { name: 'Fecha y hora' })).toBeInTheDocument();

    // Dos vueltas de las dos vistas del tiempo y después la diapositiva del feed nacional.
    for (let step = 0; step < 4; step += 1) await advance(ROTATION_INTERVAL_MS);
    await advance(ROTATION_FADE_MS);
    expect(screen.getByRole('heading', { level: 1, name: 'Nacional' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Fecha y hora' })).not.toBeInTheDocument();

    await showNextStage(SLIDE_DURATION_MS);
    const hero = screen.getByRole('region', { name: 'Noticia destacada' });
    expect(within(hero).getByRole('heading', { name: 'Titular 1' })).toBeInTheDocument();
    expect(within(hero).getByText('Descripción de la noticia 1')).toBeInTheDocument();
    expect(within(hero).getByText('Internacional')).toBeInTheDocument();

    const side = screen.getByRole('complementary', { name: 'Noticias' });
    expect(within(side).getByRole('heading', { name: 'Nacional' })).toBeInTheDocument();
    expect(within(side).getAllByRole('listitem')).toHaveLength(3);
    expect(within(side).getByText('Titular 1').closest('li')).toHaveAttribute('aria-current', 'true');

    const summary = screen.getByRole('region', { name: 'Resumen del tiempo' });
    expect(within(summary).getByTestId('clock-seconds')).toBeInTheDocument();
    expect(within(summary).getByRole('img', { name: /^Viento del/ })).toBeInTheDocument();

    await showNextStage(NEWS_ITEM_MS);
    expect(within(screen.getByRole('region', { name: 'Noticia destacada' })).getByRole('heading', { name: 'Titular 2' }))
      .toBeInTheDocument();
    expect(within(side).getByText('Titular 2').closest('li')).toHaveAttribute('aria-current', 'true');
    expect(within(side).getByText('Titular 1').closest('li')).not.toHaveAttribute('aria-current');

    // Tras la última noticia aparece la diapositiva del tiempo y se vuelve al dashboard meteorológico.
    await showNextStage(NEWS_ITEM_MS);
    await showNextStage(NEWS_ITEM_MS);
    expect(screen.getByRole('heading', { level: 1, name: 'Tiempo' })).toBeInTheDocument();

    await showNextStage(SLIDE_DURATION_MS);
    expect(screen.getByRole('region', { name: 'Fecha y hora' })).toBeInTheDocument();

    expect(fetchWeather).toHaveBeenCalledTimes(1);
    expect(fetchAirQuality).toHaveBeenCalledTimes(1);
    expect(fetchUiConfig).toHaveBeenCalledTimes(1);
    expect(fetchNewsRotation).toHaveBeenCalledTimes(1);
  });
});
