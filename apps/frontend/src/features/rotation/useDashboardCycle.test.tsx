import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SLIDE_DURATION_MS } from '../../config';
import { fetchNewsRotation } from '../../services/newsApi';
import type { NewsFeedId, NewsItem, NewsRotation } from '../../types/news';
import { useDashboardCycle } from './useDashboardCycle';

vi.mock('../../services/newsApi', () => ({ fetchNewsRotation: vi.fn() }));

const ROTATION_MS = 10_000;
const NEWS_ITEM_MS = 60_000;
const uiConfig = { rotationIntervalMs: ROTATION_MS, newsItemDurationMs: NEWS_ITEM_MS };

function buildRotation(feed: NewsFeedId, count = 3): NewsRotation {
  const items: NewsItem[] = Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    title: `Titular ${index + 1}`,
    description: 'Descripción',
    imageUrl: 'https://img.example.com/foto_800.jpg',
    publishedAt: '2026-11-24T07:32:49.000Z',
    category: 'Internacional',
  }));
  return { feed, items };
}

function renderCycle(options: Partial<Parameters<typeof useDashboardCycle>[0]> = {}) {
  return renderHook(() =>
    useDashboardCycle({ weatherPageCount: 2, uiConfig, pinnedPage: null, pinnedFeed: null, ...options }),
  );
}

async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

// Cada etapa se avanza en su propio act: React debe renderizar entre etapas para programar el siguiente temporizador.
/** Recorre los cuatro pasos del tiempo (dos vueltas completas de dos vistas) hasta cargar el feed. */
async function finishWeatherBlock() {
  for (let step = 0; step < 4; step += 1) await advance(ROTATION_MS);
}

/** Diapositiva del feed, las noticias y la diapositiva del tiempo. */
async function finishNewsBlock(itemCount = 3) {
  await advance(SLIDE_DURATION_MS);
  for (let item = 0; item < itemCount; item += 1) await advance(NEWS_ITEM_MS);
  await advance(SLIDE_DURATION_MS);
}

describe('useDashboardCycle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(fetchNewsRotation).mockImplementation(async (feed) => buildRotation(feed));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.mocked(fetchNewsRotation).mockReset();
  });

  it('muestra dos vueltas completas de las vistas del tiempo antes del feed nacional', async () => {
    const { result } = renderCycle();
    const pages: number[] = [result.current.weatherPage];

    for (let step = 0; step < 3; step += 1) {
      await advance(ROTATION_MS);
      expect(result.current.view).toBe('weather');
      pages.push(result.current.weatherPage);
    }
    expect(pages).toEqual([0, 1, 0, 1]);
    expect(fetchNewsRotation).not.toHaveBeenCalled();

    await advance(ROTATION_MS);
    expect(fetchNewsRotation).toHaveBeenCalledWith('national', expect.any(AbortSignal));
    expect(result.current).toMatchObject({ view: 'slide', slideTitle: 'Nacional' });
  });

  it('muestra cada noticia el tiempo configurado y vuelve al tiempo con su diapositiva', async () => {
    const { result } = renderCycle();
    await finishWeatherBlock();

    await advance(SLIDE_DURATION_MS);
    expect(result.current.view).toBe('news');
    expect(result.current.news?.activeIndex).toBe(0);

    await advance(NEWS_ITEM_MS);
    expect(result.current.news?.activeIndex).toBe(1);
    await advance(NEWS_ITEM_MS);
    expect(result.current.news?.activeIndex).toBe(2);

    await advance(NEWS_ITEM_MS);
    expect(result.current).toMatchObject({ view: 'slide', slideTitle: 'Tiempo' });

    await advance(SLIDE_DURATION_MS);
    expect(result.current).toMatchObject({ view: 'weather', weatherPage: 0 });
  });

  it('recorre nacional, internacional y mercados y reinicia el ciclo', async () => {
    renderCycle();

    for (let block = 0; block < 4; block += 1) {
      await finishWeatherBlock();
      await finishNewsBlock();
    }

    expect(vi.mocked(fetchNewsRotation).mock.calls.map(([feed]) => feed)).toEqual([
      'national',
      'international',
      'markets',
      'national',
    ]);
  });

  it.each([
    ['sin noticias', async () => buildRotation('national', 0)],
    ['con error', async () => Promise.reject(new Error('sin conexión'))],
  ])('salta un feed %s y sigue con el tiempo y el siguiente feed', async (_name, firstResponse) => {
    vi.mocked(fetchNewsRotation).mockImplementationOnce(firstResponse);
    const { result } = renderCycle();

    await finishWeatherBlock();
    expect(result.current).toMatchObject({ view: 'weather', weatherPage: 0 });
    expect(result.current.news).toBeNull();

    await finishWeatherBlock();
    expect(vi.mocked(fetchNewsRotation).mock.calls.map(([feed]) => feed)).toEqual(['national', 'international']);
    expect(result.current).toMatchObject({ view: 'slide', slideTitle: 'Internacional' });
  });

  it('no rota ni pide noticias con la rotación desactivada', async () => {
    const { result } = renderCycle({ uiConfig: { ...uiConfig, rotationIntervalMs: 0 } });

    await advance(ROTATION_MS * 20);

    expect(result.current).toMatchObject({ view: 'weather', weatherPage: 0, isRotating: false });
    expect(fetchNewsRotation).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('espera a conocer la configuración antes de rotar', async () => {
    const { result } = renderCycle({ uiConfig: null });

    await advance(ROTATION_MS * 5);

    expect(result.current).toMatchObject({ view: 'weather', weatherPage: 0, isRotating: false });
  });

  it('muestra la página del tiempo fijada sin rotar', async () => {
    const { result } = renderCycle({ pinnedPage: 1 });

    await advance(ROTATION_MS * 20);

    expect(result.current).toMatchObject({ view: 'weather', weatherPage: 1, isRotating: false });
    expect(fetchNewsRotation).not.toHaveBeenCalled();
  });

  it('muestra directamente el feed fijado sin diapositiva ni rotación', async () => {
    const { result } = renderCycle({ pinnedFeed: 'markets' });

    await advance(0);
    expect(fetchNewsRotation).toHaveBeenCalledWith('markets', expect.any(AbortSignal));
    expect(result.current).toMatchObject({ view: 'news', isRotating: false });
    expect(result.current.news?.rotation.feed).toBe('markets');

    await advance(NEWS_ITEM_MS * 10);
    expect(result.current.news?.activeIndex).toBe(0);
  });

  it('libera los temporizadores al desmontarse', async () => {
    const { unmount } = renderCycle();
    expect(vi.getTimerCount()).toBe(1);

    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
