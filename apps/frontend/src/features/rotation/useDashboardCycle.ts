import { useCallback, useEffect, useReducer, useRef } from 'react';

import { SLIDE_DURATION_MS, VIDEO_FALLBACK_MS, WEATHER_REPETITIONS_PER_BLOCK } from '../../config';
import { fetchNewsRotation } from '../../services/newsApi';
import type { UiConfig } from '../../services/configApi';
import { NEWS_FEED_IDS, NEWS_FEED_LABELS, type NewsFeedId, type NewsRotation } from '../../types/news';

/** Vista que ocupa la pantalla; el resto de datos se conserva para dibujar la vista saliente durante el fundido. */
export type CycleView = 'weather' | 'slide' | 'video' | 'news';

/** Vídeos de transición: `weather` precede al tiempo y cada feed tiene el suyo antes de sus noticias. */
export type VideoId = 'weather' | NewsFeedId;

export interface ActiveNews {
  rotation: NewsRotation;
  activeIndex: number;
}

export interface DashboardCycleState {
  view: CycleView;
  weatherPage: number;
  slideTitle: string;
  /** Vídeo que corresponde a la vista `video`. */
  videoId: VideoId;
  news: ActiveNews | null;
  /** Transiciones realizadas; permite sincronizar otros cambios (el tema) con la rotación. */
  tick: number;
  isRotating: boolean;
  /** Para la vista de vídeo: avisa de que terminó (o no pudo reproducirse) y el ciclo debe seguir. */
  finishVideo: () => void;
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
  /** Se queda en un feed sin diapositivas ni tiempo, pero sus noticias siguen rotando cada `newsItemDurationMs`. */
  lockedFeed?: NewsFeedId | null;
  /** Vídeos disponibles; cada uno sustituye a la diapositiva con título que le correspondería. */
  availableVideos?: readonly VideoId[];
}

type Phase = 'weather' | 'loading' | 'slide' | 'video' | 'news';

interface State {
  phase: Phase;
  /** Feed que toca tras el bloque actual de vistas del tiempo. */
  feedIndex: number;
  weatherStep: number;
  slideTitle: string;
  slideNext: 'weather' | 'news';
  videoId: VideoId;
  videoNext: 'weather' | 'news';
  rotation: NewsRotation | null;
  itemIndex: number;
  pinned: boolean;
  locked: boolean;
  tick: number;
}

type Action =
  | { type: 'advance'; weatherSteps: number; videos: readonly VideoId[] }
  | { type: 'videoFinished' }
  | { type: 'pin'; pinnedFeed: NewsFeedId | null; lockedFeed: NewsFeedId | null }
  | { type: 'loaded'; rotation: NewsRotation | null };

const WEATHER_SLIDE_TITLE = 'Tiempo';
const NO_VIDEOS: readonly VideoId[] = [];

function nextFeedIndex(index: number): number {
  return (index + 1) % NEWS_FEED_IDS.length;
}

function afterVideo(state: State, next: (changes: Partial<State>) => State): State {
  return state.videoNext === 'news' ? next({ phase: 'news', itemIndex: 0 }) : next({ phase: 'weather', weatherStep: 0 });
}

function reduce(state: State, action: Action): State {
  const next = (changes: Partial<State>): State => ({ ...state, ...changes, tick: state.tick + 1 });

  if (action.type === 'pin') {
    return { ...initialState(action.pinnedFeed, action.lockedFeed), tick: state.tick + 1 };
  }

  if (action.type === 'loaded') {
    const { rotation } = action;
    const isEmpty = rotation === null || rotation.items.length === 0;
    if (state.locked) {
      if (!isEmpty) return next({ phase: 'news', rotation, itemIndex: 0 });
      // Si la consulta falla se repiten las noticias ya mostradas y se reintenta al terminarlas.
      return state.rotation
        ? next({ phase: 'news', itemIndex: 0 })
        : next({ phase: 'weather', weatherStep: 0, rotation: null });
    }
    if (isEmpty) {
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

  if (action.type === 'videoFinished') {
    // El evento puede llegar tarde, con el ciclo ya en otra fase: entonces se ignora.
    return state.phase === 'video' ? afterVideo(state, next) : state;
  }

  switch (state.phase) {
    case 'weather':
      return state.weatherStep + 1 < action.weatherSteps
        ? next({ weatherStep: state.weatherStep + 1 })
        : next({ phase: 'loading' });
    case 'slide': {
      // El vídeo de la sección, si existe, sigue a su diapositiva.
      const videoId: VideoId = state.slideNext === 'news' && state.rotation ? state.rotation.feed : 'weather';
      if (action.videos.includes(videoId)) {
        return next({ phase: 'video', videoId, videoNext: state.slideNext });
      }
      return afterVideo({ ...state, videoNext: state.slideNext }, next);
    }
    case 'video':
      return afterVideo(state, next);
    case 'news': {
      if (state.rotation && state.itemIndex + 1 < state.rotation.items.length) {
        return next({ itemIndex: state.itemIndex + 1 });
      }
      // Con el feed bloqueado, al terminar las noticias se pide la siguiente tanda del mismo feed.
      if (state.locked) return next({ phase: 'loading' });
      const feedIndex = nextFeedIndex(state.feedIndex);
      return next({ phase: 'slide', slideTitle: WEATHER_SLIDE_TITLE, slideNext: 'weather', feedIndex });
    }
    case 'loading':
      return state;
  }
}

function initialState(pinnedFeed: NewsFeedId | null, lockedFeed: NewsFeedId | null = null): State {
  const feed = pinnedFeed ?? lockedFeed;
  return {
    phase: feed ? 'loading' : 'weather',
    feedIndex: feed ? NEWS_FEED_IDS.indexOf(feed) : 0,
    weatherStep: 0,
    slideTitle: WEATHER_SLIDE_TITLE,
    slideNext: 'weather',
    videoId: 'weather',
    videoNext: 'weather',
    rotation: null,
    itemIndex: 0,
    pinned: pinnedFeed !== null,
    locked: pinnedFeed === null && lockedFeed !== null,
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
    case 'video':
      return VIDEO_FALLBACK_MS;
    case 'loading':
      return null;
  }
}

/**
 * Ciclo del dashboard: las vistas del tiempo se repiten y después se muestra un feed de noticias, y así con
 * cada feed. Antes de cada feed aparece su vídeo (o una diapositiva con su título si no hay vídeo) y, al volver
 * al tiempo, el vídeo del tiempo (o la diapositiva «Tiempo»). Un feed sin noticias se salta.
 */
export function useDashboardCycle({
  weatherPageCount,
  uiConfig,
  pinnedPage,
  pinnedFeed,
  lockedFeed = null,
  availableVideos = NO_VIDEOS,
}: DashboardCycleOptions): DashboardCycleState {
  const [state, dispatch] = useReducer(reduce, { pinnedFeed, lockedFeed }, ({ pinnedFeed, lockedFeed }) =>
    initialState(pinnedFeed, lockedFeed),
  );
  const weatherSteps = Math.max(weatherPageCount, 1) * WEATHER_REPETITIONS_PER_BLOCK;
  // En una ref para que cambiar la lista no reinicie el temporizador de la fase en curso.
  const videos = useRef(availableVideos);
  videos.current = availableVideos;
  const canRotate =
    uiConfig !== null && uiConfig.rotationIntervalMs > 0 && pinnedPage === null && pinnedFeed === null;
  // Con el feed bloqueado solo rota el contenido del feed: el resto del ciclo queda fijo.
  const isRotating = canRotate && lockedFeed === null;
  const durationMs = !canRotate
    ? null
    : lockedFeed === null
      ? phaseDurationMs(state.phase, uiConfig)
      : state.phase === 'news'
        ? uiConfig.newsItemDurationMs
        : null;

  useEffect(() => {
    if (durationMs === null) return;

    const id = window.setTimeout(
      () => dispatch({ type: 'advance', weatherSteps, videos: videos.current }),
      durationMs,
    );
    return () => window.clearTimeout(id);
  }, [state.tick, durationMs, weatherSteps]);

  const finishVideo = useCallback(() => dispatch({ type: 'videoFinished' }), []);

  // Los feeds fijados pueden llegar después del montaje (la configuración del backend es asíncrona).
  const previousPins = useRef({ pinnedFeed, lockedFeed });
  useEffect(() => {
    if (previousPins.current.pinnedFeed === pinnedFeed && previousPins.current.lockedFeed === lockedFeed) return;
    previousPins.current = { pinnedFeed, lockedFeed };
    dispatch({ type: 'pin', pinnedFeed, lockedFeed });
  }, [pinnedFeed, lockedFeed]);

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
    // Entre dos tandas de un feed bloqueado se mantiene la última noticia en lugar de volver al tiempo.
    view:
      state.phase === 'slide' || state.phase === 'video' || state.phase === 'news'
        ? state.phase
        : state.phase === 'loading' && state.locked && state.rotation
          ? 'news'
          : 'weather',
    weatherPage: (pinnedPage ?? state.weatherStep) % Math.max(weatherPageCount, 1),
    slideTitle: state.slideTitle,
    videoId: state.videoId,
    news: state.rotation
      ? { rotation: state.rotation, activeIndex: Math.min(state.itemIndex, state.rotation.items.length - 1) }
      : null,
    tick: state.tick,
    isRotating,
    finishVideo,
  };
}
