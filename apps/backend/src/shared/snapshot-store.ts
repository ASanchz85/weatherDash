/** Último dato obtenido de un proveedor, tal y como se conserva entre reinicios. */
export interface StoredSnapshot<T> {
  value: T;
  /** Instante (ms) en que se obtuvo el dato del proveedor. */
  fetchedAt: number;
}

/** Almacén persistente de un único recurso: guarda solo la última versión, nunca un histórico. */
export interface SnapshotStore<T> {
  /** Último dato guardado, o null si todavía no hay ninguno. */
  load(): StoredSnapshot<T> | null;
  /** Reemplaza el dato guardado por el nuevo. */
  save(snapshot: StoredSnapshot<T>): void;
}

/** Punto de acceso a los almacenes de cada recurso; desacopla los servicios del motor de base de datos. */
export interface SnapshotStorage {
  storeFor<T>(resource: SnapshotResource): SnapshotStore<T>;
}

/** Recursos que se persisten; cada uno ocupa una única fila. */
export type SnapshotResource = 'weather' | 'air-quality';
