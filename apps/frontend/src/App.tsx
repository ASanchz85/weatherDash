import { useState } from 'react';

import styles from './App.module.css';
import { useDashboardData } from './features/dashboard/useDashboardData';
import { WEATHER_PAGE_COUNT, WeatherDashboard } from './features/dashboard/WeatherDashboard';
import { NewsDashboard } from './features/news/NewsDashboard';
import { parseDebugOverrides } from './features/rotation/debugOverrides';
import { RotatingView, type RotatingViewItem } from './features/rotation/RotatingView';
import { TitleSlide } from './features/rotation/TitleSlide';
import { useDashboardCycle, type CycleView } from './features/rotation/useDashboardCycle';
import { useUiConfig } from './features/rotation/useUiConfig';
import { useCommittedTheme } from './features/theme/useCommittedTheme';
import { themeFromIsDay } from './types/theme';

const VIEW_ORDER: readonly CycleView[] = ['weather', 'slide', 'news'];

export function App() {
  // Los datos se piden aquí, fuera de las vistas rotatorias, para que rotar nunca provoque una consulta.
  const { weather, airQuality } = useDashboardData();
  const uiConfig = useUiConfig();
  const [overrides] = useState(() => parseDebugOverrides(window.location.search));

  const cycle = useDashboardCycle({
    weatherPageCount: WEATHER_PAGE_COUNT,
    uiConfig,
    pinnedPage: overrides.page,
    pinnedFeed: overrides.feed,
  });
  const desiredTheme = weather.status === 'ready' ? themeFromIsDay(weather.data.current.isDay) : null;
  const committedTheme = useCommittedTheme(desiredTheme, cycle.tick, cycle.isRotating);
  const theme = overrides.theme ?? committedTheme;

  // Todas las vistas se declaran siempre para que la saliente se siga dibujando durante su fundido.
  const views: RotatingViewItem[] = [
    {
      id: 'weather',
      content: <WeatherDashboard weather={weather} airQuality={airQuality} page={cycle.weatherPage} theme={theme} />,
    },
    { id: 'slide', content: <TitleSlide title={cycle.slideTitle} /> },
    { id: 'news', content: cycle.news && <NewsDashboard news={cycle.news} weather={weather} /> },
  ];

  return (
    <main className={styles.root}>
      <RotatingView views={views} page={VIEW_ORDER.indexOf(cycle.view)} />
    </main>
  );
}
