import { useEffect, useState } from 'react';

import { WEATHER_POLL_INTERVAL_MS, WEATHER_RETRY_INTERVAL_MS } from '../../config';
import { fetchWeather } from '../../services/weatherApi';
import type { WeatherData } from '../../types/weather';

export type WeatherState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  /** refreshFailed: la última consulta a la API local falló y se muestran los datos anteriores. */
  | { status: 'ready'; data: WeatherData; refreshFailed: boolean };

const UNKNOWN_ERROR_MESSAGE = 'Error desconocido';

/** Consulta la API local periódicamente, conservando los últimos datos válidos si una consulta falla. */
export function useWeather(): WeatherState {
  const [state, setState] = useState<WeatherState>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    let timeoutId: number | undefined;

    const load = async () => {
      let nextDelay = WEATHER_POLL_INTERVAL_MS;
      try {
        const data = await fetchWeather(controller.signal);
        if (controller.signal.aborted) return;
        setState({ status: 'ready', data, refreshFailed: false });
      } catch (error) {
        if (controller.signal.aborted) return;
        nextDelay = WEATHER_RETRY_INTERVAL_MS;
        const message = error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE;
        setState((previous) =>
          previous.status === 'ready'
            ? { ...previous, refreshFailed: true }
            : { status: 'error', message },
        );
      }
      timeoutId = window.setTimeout(() => void load(), nextDelay);
    };

    void load();

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, []);

  return state;
}
