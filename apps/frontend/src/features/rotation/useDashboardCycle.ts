import { useEffect, useReducer } from 'react';

import { SLIDE_DURATION_MS, WEATHER_REPETITIONS_PER_BLOCK } from '../../config';
import { fetchNewsRotation } from '../../services/newsApi';
import type { UiConfig } from '../../services/configApi';
import { NEWS_FEED_IDS, NEWS_FEED_LABELS, type NewsFeedId, type NewsRotation } from '../../types/news';

/** Vista que ocupa la pantalla; el resto de datos se conserva para dibujar la vista saliente durante el fundido. */
export type CycleView = 'weather' | 'slide' | 'news';

export interface ActiveNews {
  rotation: NewsRotation;
  activeIndex: number;
}

export interface DashboardCycleState {
  view: CycleView;
  weatherPage: number;
  slideTitle: string;
  news: ActiveNews | null;
  /** Transiciones realizadas; permite sincronizar otros cambios (el tema) con la rotación. */
  tick: number;
  isRotating: boolean;
}

interface DashboardCycleOptions {
  /** Vistas distintas del tiempo que se alternan. */
  weatherPageCount: number;
  /** null mientras se consulta; con rotationIntervalMs = 0 solo se muestra el tiempo. */
  uiConfig: UiConfig | null;
  /** Fija una página del tiempo y desactiva la rotación. */
  pinnedPage: number | null;
  /** Fija la vista de noticias de un feed y desactiva la rotación. */
  pinnedFeed: NewsFeedId | null;
}

type Phase = 'weather' | 'loading' | 'slide' | 'news';

interface State {
  phase: Phase;
  /** Feed que toca tras el bloque actual de vistas del tiempo. */
  feedIndex: number;
  weatherStep: number;
  slideTitle: string;
  slideNext: 'weather' | 'news';
  rotation: NewsRotation | null;
  itemIndex: number;
  pinned: boolean;
  tick: number;
}

type Action =
  | { type: 'advance'; weatherSteps: number }
  | { type: 'loaded'; rotation: NewsRotation | null };

const WEATHER_SLIDE_TITLE = 'Tiempo';

function nextFeedIndex(index: number): number {
  return (index + 1) % NEWS_FEED_IDS.length;
}

function reduce(state: State, action: Action): State {
  const next = (changes: Partial<State>): State => ({ ...state, ...changes, tick: state.tick + 1 });

  if (action.type === 'loaded') {
    const { rotation } = action;
    if (rotation === null || rotation.items.length === 0) {
      // Un feed sin noticias se salta: el ciclo sigue con el tiempo.
      return next({ phase: 'weather', weatherStep: 0, rotation: null, feedIndex: nextFeedIndex(state.feedIndex) });
    }
    if (state.pinned) return next({ phase: 'news', rotation, itemIndex: 0 });
    return next({
      phase: 'slide',
      slideTitle: NEWS_FEED_LABELS[rotation.feed],
      slideNext: 'news',
      rotation,
      itemIndex: 0,
    });
  }

  switch (state.phase) {
    case 'weather':
      return state.weatherStep + 1 < action.weatherSteps
        ? next({ weatherStep: state.weatherStep + 1 })
        : next({ phase: 'loading' });
    case 'slide':
      return state.slideNext === 'news'
        ? next({ phase: 'news', itemIndex: 0 })
        : next({ phase: 'weather', weatherStep: 0 });
    case 'news':
      return state.rotation && state.itemIndex + 1 < state.rotation.items.length
        ? next({ itemIndex: state.itemIndex + 1 })
        : next({
            phase: 'slide',
            slideTitle: WEATHER_SLIDE_TITLE,
            slideNext: 'weather',
            feedIndex: nextFeedIndex(state.feedIndex),
          });
    case 'loading':
      return state;
  }
}

function initialState(pinnedFeed: NewsFeedId | null): State {
  return {
    phase: pinnedFeed ? 'loading' : 'weather',
    feedIndex: pinnedFeed ? NEWS_FEED_IDS.indexOf(pinnedFeed) : 0,
    weatherStep: 0,
    slideTitle: WEATHER_SLIDE_TITLE,
    slideNext: 'weather',
    rotation: null,
    itemIndex: 0,
    pinned: pinnedFeed !== null,
    tick: 0,
  };
}

function phaseDurationMs(phase: Phase, config: UiConfig): number | null {
  switch (phase) {
    case 'weather':
      return config.rotationIntervalMs;
    case 'slide':
      return SLIDE_DURATION_MS;
    case 'news':
      return config.newsItemDurationMs;
    case 'loading':
      return null;
  }
}

/**
 * Ciclo del dashboard: las vistas del tiempo se repiten y después se muestra un feed de noticias, y así con
 * cada feed. Antes de cada bloque aparece una diapositiva con su título. Un feed sin noticias se salta.
 */
export function useDashboardCycle({
  weatherPageCount,
  uiConfig,
  pinnedPage,
  pinnedFeed,
}: DashboardCycleOptions): DashboardCycleState {
  const [state, dispatch] = useReducer(reduce, pinnedFeed, initialState);
  const weatherSteps = Math.max(weatherPageCount, 1) * WEATHER_REPETITIONS_PER_BLOCK;
  const isRotating =
    uiConfig !== null && uiConfig.rotationIntervalMs > 0 && pinnedPage === null && pinnedFeed === null;
  const durationMs = isRotating ? phaseDurationMs(state.phase, uiConfig) : null;

  useEffect(() => {
    if (durationMs === null) return;

    const id = window.setTimeout(() => dispatch({ type: 'advance', weatherSteps }), durationMs);
    return () => window.clearTimeout(id);
  }, [state.tick, durationMs, weatherSteps]);

  useEffect(() => {
    if (state.phase !== 'loading') return;

    const controller = new AbortController();
    const feed = NEWS_FEED_IDS[state.feedIndex] ?? NEWS_FEED_IDS[0];
    fetchNewsRotation(feed, controller.signal)
      .then((rotation) => dispatch({ type: 'loaded', rotation }))
      .catch(() => {
        if (!controller.signal.aborted) dispatch({ type: 'loaded', rotation: null });
      });

    return () => controller.abort();
  }, [state.phase, state.feedIndex]);

  return {
    view: state.phase === 'slide' || state.phase === 'news' ? state.phase : 'weather',
    weatherPage: (pinnedPage ?? state.weatherStep) % Math.max(weatherPageCount, 1),
    slideTitle: state.slideTitle,
    news: state.rotation
      ? { rotation: state.rotation, activeIndex: Math.min(state.itemIndex, state.rotation.items.length - 1) }
      : null,
    tick: state.tick,
    isRotating,
  };
}
