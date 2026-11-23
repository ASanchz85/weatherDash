import { CloudOff } from 'lucide-react';

import styles from './WeatherPanel.module.css';
import { WeatherDetails } from './WeatherDetails';
import type { WeatherState } from './useWeather';

interface WeatherPanelProps {
  state: WeatherState;
}

export function WeatherPanel({ state }: WeatherPanelProps) {
  switch (state.status) {
    case 'loading':
      return (
        <div className={styles.message} aria-busy="true">
          <p className={styles.messageTitle}>Cargando meteorología…</p>
        </div>
      );
    case 'error':
      return (
        <div className={styles.message} role="alert">
          <CloudOff className={styles.messageIcon} strokeWidth={1.5} aria-hidden="true" />
          <p className={styles.messageTitle}>Meteorología no disponible</p>
          <p className={styles.messageDetail}>{state.message}</p>
          <p className={styles.messageDetail}>Se reintentará automáticamente.</p>
        </div>
      );
    case 'ready':
      return <WeatherDetails data={state.data} refreshFailed={state.refreshFailed} />;
  }
}
