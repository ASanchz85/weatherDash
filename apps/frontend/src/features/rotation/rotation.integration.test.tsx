import { act, render, renderHook, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ROTATION_FADE_MS } from '../../config';
import { fetchUiConfig } from '../../services/configApi';
import { fetchWeather } from '../../services/weatherApi';
import { buildWeatherData } from '../../test/weatherFixtures';
import { useWeather } from '../weather/useWeather';
import { RotatingView } from './RotatingView';
import { useRotation } from './useRotation';
import { useRotationInterval } from './useRotationInterval';

vi.mock('../../services/weatherApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../services/weatherApi')>()),
  fetchWeather: vi.fn(),
}));

vi.mock('../../services/configApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../services/configApi')>()),
  fetchUiConfig: vi.fn(),
}));

const ROTATION_INTERVAL_MS = 10_000;

/** Misma composición que App: los datos y la rotación viven fuera de las vistas. */
function Harness() {
  const weather = useWeather();
  const intervalMs = useRotationInterval();
  const page = useRotation(2, intervalMs).page;

  return (
    <RotatingView
      page={page}
      views={[
        { id: 'a', content: <p>Vista A {weather.status}</p> },
        { id: 'b', content: <p>Vista B {weather.status}</p> },
      ]}
    />
  );
}

async function flushPromises() {
  await act(async () => {
    await Promise.resolve();
  });
}

describe('rotación y datos', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(fetchWeather).mockResolvedValue(buildWeatherData());
    vi.mocked(fetchUiConfig).mockResolvedValue({ rotationIntervalMs: ROTATION_INTERVAL_MS });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.mocked(fetchWeather).mockReset();
    vi.mocked(fetchUiConfig).mockReset();
  });

  it('rotar entre vistas no provoca nuevas consultas de datos ni de configuración', async () => {
    render(<Harness />);
    await flushPromises();
    expect(screen.getByText('Vista A ready')).toBeInTheDocument();
    expect(fetchWeather).toHaveBeenCalledTimes(1);
    expect(fetchUiConfig).toHaveBeenCalledTimes(1);

    for (const expected of ['Vista B ready', 'Vista A ready', 'Vista B ready']) {
      // act agrupa los cambios de estado: el fundido de salida empieza cuando termina el primer avance.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(ROTATION_INTERVAL_MS);
      });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(ROTATION_FADE_MS);
      });
      expect(screen.getByText(expected)).toBeInTheDocument();
    }

    expect(fetchWeather).toHaveBeenCalledTimes(1);
    expect(fetchUiConfig).toHaveBeenCalledTimes(1);
  });

  it('useRotationInterval usa el intervalo por defecto si la configuración falla', async () => {
    vi.mocked(fetchUiConfig).mockRejectedValue(new Error('sin conexión'));
    const { result } = renderHook(() => useRotationInterval());
    expect(result.current).toBeNull();

    await flushPromises();
    expect(result.current).toBe(5 * 60 * 1000);
  });
});
