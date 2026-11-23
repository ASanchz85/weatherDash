import styles from './App.module.css';
import { ForecastPanel } from './components/ForecastPanel';
import { HeroPanel } from './components/HeroPanel';
import { SidePanel } from './components/SidePanel';
import { Clock } from './features/clock/Clock';
import { WeeklyForecast } from './features/forecast/WeeklyForecast';
import { useWeather } from './features/weather/useWeather';
import { WeatherPanel } from './features/weather/WeatherPanel';

export function App() {
  const weather = useWeather();

  return (
    <main className={styles.dashboard}>
      <HeroPanel label="Fecha y hora">
        <Clock />
      </HeroPanel>
      <SidePanel label="Meteorología">
        <WeatherPanel state={weather} />
      </SidePanel>
      <ForecastPanel label="Predicción semanal">
        <WeeklyForecast state={weather} />
      </ForecastPanel>
    </main>
  );
}
