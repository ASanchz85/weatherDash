import styles from './App.module.css';
import { HeroPanel } from './components/HeroPanel';
import { SidePanel } from './components/SidePanel';
import { Clock } from './features/clock/Clock';
import { WeatherPanel } from './features/weather/WeatherPanel';

export function App() {
  return (
    <main className={styles.dashboard}>
      <HeroPanel label="Fecha y hora">
        <Clock />
      </HeroPanel>
      <SidePanel label="Meteorología">
        <WeatherPanel />
      </SidePanel>
    </main>
  );
}
