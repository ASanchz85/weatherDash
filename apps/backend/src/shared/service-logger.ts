/** Registro mínimo que necesitan los servicios; Fastify lo satisface con app.log. */
export interface ServiceLogger {
  warn(details: object, message: string): void;
}
