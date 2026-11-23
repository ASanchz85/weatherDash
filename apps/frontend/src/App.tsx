import { useState } from 'react';

import styles from './App.module.css';
import { ForecastPanel } from './components/ForecastPanel';
import { HeroPanel } from './components/HeroPanel';
import { SidePanel } from './components/SidePanel';
import { Clock } from './features/clock/Clock';
import { WeeklyForecast } from './features/forecast/WeeklyForecast';
import { parseDebugOverrides } from './features/rotation/debugOverrides';
import { RotatingView, type RotatingViewItem } from './features/rotation/RotatingView';
import { useRotation } from './features/rotation/useRotation';
import { useRotationInterval } from './features/rotation/useRotationInterval';
import { useCommittedTheme } from './features/theme/useCommittedTheme';
import { useWeather } from './features/weather/useWeather';
import { WeatherPanel } from './features/weather/WeatherPanel';
import { themeFromIsDay } from './types/theme';

export function App() {
  // Los datos se piden aquí, fuera de las vistas rotatorias, para que rotar nunca provoque una consulta.
  const weather = useWeather();
  const rotationIntervalMs = useRotationInterval();
  const [overrides] = useState(() => parseDebugOverrides(window.location.search));

  const sideViews: RotatingViewItem[] = [
    { id: 'weather', content: <WeatherPanel state={weather} /> },
  ];
  const bottomViews: RotatingViewItem[] = [
    { id: 'weekly', content: <WeeklyForecast state={weather} /> },
  ];

  const { page, tick, isRotating } = useRotation(
    Math.max(sideViews.length, bottomViews.length),
    rotationIntervalMs,
    overrides.page,
  );
  const desiredTheme = weather.status === 'ready' ? themeFromIsDay(weather.data.current.isDay) : null;
  const committedTheme = useCommittedTheme(desiredTheme, tick, isRotating);
  const theme = overrides.theme ?? committedTheme;

  return (
    <main className={styles.dashboard}>
      <HeroPanel label="Fecha y hora" theme={theme}>
        <Clock />
      </HeroPanel>
      <SidePanel label="Meteorología">
        <RotatingView views={sideViews} page={page} />
      </SidePanel>
      <ForecastPanel label="Predicción semanal">
        <RotatingView views={bottomViews} page={page} />
      </ForecastPanel>
    </main>
  );
}
