import { useState } from 'react';

import styles from './App.module.css';
import { useDashboardData } from './features/dashboard/useDashboardData';
import { WEATHER_PAGE_COUNT, WeatherDashboard } from './features/dashboard/WeatherDashboard';
import { NewsDashboard } from './features/news/NewsDashboard';
import { parseDebugOverrides } from './features/rotation/debugOverrides';
import { INTRO_VIDEO_URL } from './features/rotation/introVideo';
import { RotatingView, type RotatingViewItem } from './features/rotation/RotatingView';
import { TitleSlide } from './features/rotation/TitleSlide';
import { useDashboardCycle, type CycleView } from './features/rotation/useDashboardCycle';
import { useUiConfig } from './features/rotation/useUiConfig';
import { VideoSlide } from './features/rotation/VideoSlide';
import { useCommittedTheme } from './features/theme/useCommittedTheme';
import { useHeroPhoto } from './features/theme/useHeroPhoto';
import { themeFromIsDay } from './types/theme';

const VIEW_ORDER: readonly CycleView[] = ['weather', 'slide', 'video', 'news'];

export function App() {
  // Los datos se piden aquí, fuera de las vistas rotatorias, para que rotar nunca provoque una consulta.
  const { weather, airQuality } = useDashboardData();
  const uiConfig = useUiConfig();
  const [overrides] = useState(() => parseDebugOverrides(window.location.search));
  // Los parámetros de la URL mandan sobre la pantalla fijada en el backend (UI_PINNED_SCREEN).
  const urlPins = overrides.page !== null || overrides.feed !== null;
  const configPin = urlPins ? null : (uiConfig?.pinnedScreen ?? null);

  const cycle = useDashboardCycle({
    weatherPageCount: WEATHER_PAGE_COUNT,
    uiConfig,
    pinnedPage: configPin ? configPin.page : overrides.page,
    pinnedFeed: overrides.feed,
    lockedFeed: configPin ? configPin.feed : null,
    videoAvailable: INTRO_VIDEO_URL !== null,
  });
  const desiredTheme = weather.status === 'ready' ? themeFromIsDay(weather.data.current.isDay) : null;
  const committedTheme = useCommittedTheme(desiredTheme, cycle.tick, cycle.isRotating);
  const theme = overrides.theme ?? committedTheme;
  const heroPhoto = useHeroPhoto(theme, cycle.tick, cycle.view === 'weather');

  // Todas las vistas se declaran siempre para que la saliente se siga dibujando durante su fundido.
  const views: RotatingViewItem[] = [
    {
      id: 'weather',
      content: (
        <WeatherDashboard
          weather={weather}
          airQuality={airQuality}
          page={cycle.weatherPage}
          theme={theme}
          heroPhoto={heroPhoto}
        />
      ),
    },
    { id: 'slide', content: <TitleSlide title={cycle.slideTitle} /> },
    {
      id: 'video',
      content: INTRO_VIDEO_URL && <VideoSlide src={INTRO_VIDEO_URL} onFinished={cycle.finishVideo} />,
    },
    { id: 'news', content: cycle.news && <NewsDashboard news={cycle.news} weather={weather} /> },
  ];

  return (
    <main className={styles.root}>
      <RotatingView views={views} page={VIEW_ORDER.indexOf(cycle.view)} />
    </main>
  );
}
