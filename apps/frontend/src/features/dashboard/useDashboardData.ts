import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';

import { DATA_RETRY_INTERVAL_MS, REFRESH_GRACE_MS } from '../../config';
import { fetchAirQuality } from '../../services/airQualityApi';
import { fetchWeather } from '../../services/weatherApi';
import type { AirQualityData } from '../../types/airQuality';
import type { WeatherData } from '../../types/weather';

export type FetchState<T> =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  /** refreshFailed: la última consulta a la API local falló y se muestran los datos anteriores. */
  | { status: 'ready'; data: T; refreshFailed: boolean };

export type WeatherState = FetchState<WeatherData>;
export type AirQualityState = FetchState<AirQualityData>;

export interface DashboardData {
  weather: WeatherState;
  airQuality: AirQualityState;
}

type Outcome<T> = { kind: 'ok'; data: T } | { kind: 'failed' } | { kind: 'aborted' };

const UNKNOWN_ERROR_MESSAGE = 'Error desconocido';

/** Pide un dato, publica su estado en cuanto llega y nunca rechaza: el ciclo solo necesita saber el resultado. */
async function load<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  setState: Dispatch<SetStateAction<FetchState<T>>>,
  signal: AbortSignal,
): Promise<Outcome<T>> {
  try {
    const data = await fetcher(signal);
    if (signal.aborted) return { kind: 'aborted' };
    setState({ status: 'ready', data, refreshFailed: false });
    return { kind: 'ok', data };
  } catch (error) {
    if (signal.aborted) return { kind: 'aborted' };
    const message = error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE;
    setState((previous) =>
      previous.status === 'ready' ? { ...previous, refreshFailed: true } : { status: 'error', message },
    );
    return { kind: 'failed' };
  }
}

/**
 * Único dueño de la consulta de datos: pide el tiempo y la calidad del aire a la vez y repite el ciclo
 * cuando el servidor indica que su caché caduca. Vive fuera de las vistas rotatorias, así que rotar no consulta.
 */
export function useDashboardData(): DashboardData {
  const [weather, setWeather] = useState<WeatherState>({ status: 'loading' });
  const [airQuality, setAirQuality] = useState<AirQualityState>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    let timeoutId: number | undefined;

    const runCycle = async () => {
      const [weatherOutcome, airQualityOutcome] = await Promise.all([
        load(fetchWeather, setWeather, signal),
        load(fetchAirQuality, setAirQuality, signal),
      ]);
      if (weatherOutcome.kind === 'aborted' || airQualityOutcome.kind === 'aborted') return;

      // Con datos nuevos se espera a que caduque la caché del servidor; ante un fallo, reintento rápido.
      const refreshDelay =
        weatherOutcome.kind === 'ok'
          ? weatherOutcome.data.nextRefreshInMs + REFRESH_GRACE_MS
          : DATA_RETRY_INTERVAL_MS;
      const delay = airQualityOutcome.kind === 'failed' ? Math.min(refreshDelay, DATA_RETRY_INTERVAL_MS) : refreshDelay;

      timeoutId = window.setTimeout(() => void runCycle(), delay);
    };

    void runCycle();

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, []);

  return { weather, airQuality };
}
