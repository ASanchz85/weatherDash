import type {
  SnapshotResource,
  SnapshotStorage,
  SnapshotStore,
  StoredSnapshot,
} from '../shared/snapshot-store.js';
import type { SqliteDatabase } from './database.js';

interface SnapshotRow {
  payload: string;
  fetchedAt: number;
}

interface SnapshotParams {
  resource: SnapshotResource;
  payload: string;
  fetchedAt: number;
}

/** Almacena cada recurso como JSON en una única fila de `snapshots`, que se sobrescribe en cada guardado. */
export function createSqliteSnapshotStorage(db: SqliteDatabase): SnapshotStorage {
  const selectSnapshot = db.prepare<[SnapshotResource], SnapshotRow>(
    'SELECT payload, fetched_at AS fetchedAt FROM snapshots WHERE resource = ?',
  );
  const upsertSnapshot = db.prepare<[SnapshotParams]>(
    `INSERT INTO snapshots (resource, payload, fetched_at)
     VALUES (@resource, @payload, @fetchedAt)
     ON CONFLICT (resource) DO UPDATE SET payload = excluded.payload, fetched_at = excluded.fetched_at`,
  );

  return {
    storeFor<T>(resource: SnapshotResource): SnapshotStore<T> {
      return {
        load(): StoredSnapshot<T> | null {
          const row = selectSnapshot.get(resource);
          if (!row) return null;
          return { value: JSON.parse(row.payload) as T, fetchedAt: row.fetchedAt };
        },
        save({ value, fetchedAt }: StoredSnapshot<T>): void {
          upsertSnapshot.run({ resource, payload: JSON.stringify(value), fetchedAt });
        },
      };
    },
  };
}
