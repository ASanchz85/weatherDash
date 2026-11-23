import type { FastifyPluginAsync } from 'fastify';

import type { UiConfig } from '../../config/env.js';

export interface UiRoutesOptions {
  uiConfig: UiConfig;
}

/** Configuración de la interfaz leída en tiempo de ejecución, para no recompilar el frontend al cambiarla. */
export const uiRoutes: FastifyPluginAsync<UiRoutesOptions> = async (app, { uiConfig }) => {
  app.get('/api/config', async (_request, reply) => {
    reply.header('Cache-Control', 'no-store');
    return { rotationIntervalMs: uiConfig.rotationIntervalMs };
  });
};
