import { useEffect, useState } from 'react';

import { DEFAULT_NEWS_ITEM_DURATION_MS, DEFAULT_ROTATION_INTERVAL_MS } from '../../config';
import { fetchUiConfig, type UiConfig } from '../../services/configApi';

const FALLBACK_UI_CONFIG: UiConfig = {
  rotationIntervalMs: DEFAULT_ROTATION_INTERVAL_MS,
  newsItemDurationMs: DEFAULT_NEWS_ITEM_DURATION_MS,
};

/** Configuración de rotación del backend; null mientras se consulta. Si falla, se usan los valores por defecto. */
export function useUiConfig(): UiConfig | null {
  const [config, setConfig] = useState<UiConfig | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetchUiConfig(controller.signal)
      .then(setConfig)
      .catch(() => {
        if (!controller.signal.aborted) setConfig(FALLBACK_UI_CONFIG);
      });

    return () => controller.abort();
  }, []);

  return config;
}
