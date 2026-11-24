import { ForecastPanel } from '../../components/ForecastPanel';
import { Clock } from '../clock/Clock';
import type { WeatherState } from '../dashboard/useDashboardData';
import { WeatherIcon } from '../weather/WeatherIcon';
import { formatTemperature, formatWindSpeed } from '../weather/weatherFormat';
import { WindRose } from '../wind-air/WindRose';
import { formatWindDirection } from '../wind-air/windAirFormat';
import styles from './WeatherSummary.module.css';

function Unavailable({ state }: { state: Exclude<WeatherState, { status: 'ready' }> }) {
  return (
    <p className={styles.message} role="status" aria-busy={state.status === 'loading'}>
      {state.status === 'loading' ? 'Cargando meteorología…' : 'Meteorología no disponible'}
    </p>
  );
}

/** Franja inferior de las noticias: reloj, temperatura actual y rosa de los vientos. */
export function WeatherSummary({ state }: { state: WeatherState }) {
  return (
    <ForecastPanel label="Resumen del tiempo">
      <div className={styles.summary}>
        <section className={styles.block} aria-label="Hora">
          <Clock />
        </section>
        {state.status === 'ready' ? (
          <>
            <section className={styles.block} aria-label="Temperatura">
              <WeatherIcon
                name={state.data.current.icon}
                isDay={state.data.current.isDay}
                className={styles.icon}
              />
              <div className={styles.text}>
                <p className={styles.temperature}>
                  {formatTemperature(state.data.current.temperature)}
                  <span className={styles.unit}>C</span>
                </p>
                <p className={styles.detail}>{state.data.current.description}</p>
              </div>
            </section>
            <section className={styles.block} aria-label="Viento">
              <WindRose directionDegrees={state.data.current.windDirection} className={styles.rose} />
              <div className={styles.text}>
                <p className={styles.temperature}>
                  {Math.round(state.data.current.windSpeed)}
                  <span className={styles.speedUnit}>km/h</span>
                </p>
                <p className={styles.detail}>Dirección {formatWindDirection(state.data.current.windDirection)}</p>
                <p className={styles.detail}>
                  Rachas {state.data.current.windGusts === null ? '—' : formatWindSpeed(state.data.current.windGusts)}
                </p>
              </div>
            </section>
          </>
        ) : (
          <Unavailable state={state} />
        )}
      </div>
    </ForecastPanel>
  );
}
