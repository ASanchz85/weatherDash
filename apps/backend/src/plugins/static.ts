import { existsSync } from 'node:fs';

import fastifyStatic from '@fastify/static';
import type { FastifyPluginAsync } from 'fastify';

const API_PREFIX = '/api/';
const INDEX_FILE = 'index.html';

export interface StaticFrontendOptions {
  root: string;
}

/** Sirve el frontend compilado por Vite y devuelve index.html para cualquier ruta que no sea de la API. */
export const staticFrontend: FastifyPluginAsync<StaticFrontendOptions> = async (app, { root }) => {
  if (!existsSync(root)) {
    app.log.warn({ root }, 'No existe el frontend compilado; ejecuta "npm run build"');
    return;
  }

  await app.register(fastifyStatic, { root, wildcard: false });

  app.setNotFoundHandler((request, reply) => {
    if (request.method !== 'GET' || request.url.startsWith(API_PREFIX)) {
      return reply.code(404).send({ error: 'NOT_FOUND' });
    }
    return reply.sendFile(INDEX_FILE);
  });
};
