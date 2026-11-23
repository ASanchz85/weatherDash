import { useEffect, useState } from 'react';

import { DEFAULT_ROTATION_INTERVAL_MS } from '../../config';
import { fetchUiConfig } from '../../services/configApi';

/** Intervalo de rotación configurado en el backend; null mientras se consulta. Si falla, se usa el valor por defecto. */
export function useRotationInterval(): number | null {
  const [intervalMs, setIntervalMs] = useState<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetchUiConfig(controller.signal)
      .then(({ rotationIntervalMs }) => setIntervalMs(rotationIntervalMs))
      .catch(() => {
        if (!controller.signal.aborted) setIntervalMs(DEFAULT_ROTATION_INTERVAL_MS);
      });

    return () => controller.abort();
  }, []);

  return intervalMs;
}
