import type {
  ArrangementLoopRange,
  ArrangementTrack,
  Clip,
  ClipInstance,
  MasterMixerState,
  SampleMeta,
  TrackMixerState,
} from "../model";
import {
  DEFAULT_ARRANGEMENT_LENGTH_BARS,
  normalizeArrangementLengthBars,
} from "../model";

export const ACTIVE_PROJECT_ID = "active-project";
export const PROJECT_DOCUMENT_VERSION = 1;

const DATABASE_NAME = "mini-daw-project-store";
const DATABASE_VERSION = 1;
const PROJECT_STORE_NAME = "projects";
const SAMPLE_BLOB_STORE_NAME = "sampleBlobs";

export interface PersistedProjectDocument {
  arrangementLengthBars: number;
  arrangementLoopRange: ArrangementLoopRange;
  arrangementTracks: ArrangementTrack[];
  clipInstances: ClipInstance[];
  clips: Clip[];
  id: string;
  masterMixerState: MasterMixerState;
  name: string;
  sampleMetas: SampleMeta[];
  savedAt: number;
  tempoBpm: number;
  trackMixerStates: TrackMixerState[];
  version: typeof PROJECT_DOCUMENT_VERSION;
}

export interface CreatePersistedProjectDocumentOptions {
  arrangementLengthBars: number;
  arrangementLoopRange: ArrangementLoopRange;
  arrangementTracks: readonly ArrangementTrack[];
  clipInstances: readonly ClipInstance[];
  clips: readonly Clip[];
  masterMixerState: MasterMixerState;
  name: string;
  sampleMetas: readonly SampleMeta[];
  savedAt?: number;
  tempoBpm: number;
  trackMixerStates: readonly TrackMixerState[];
}

export interface ImportedSampleBlobRecord {
  blob: Blob;
  fileName?: string;
  mimeType?: string;
  sampleId: string;
  updatedAt: number;
}

export interface SaveImportedSampleBlobOptions {
  blob: Blob;
  fileName?: string;
  mimeType?: string;
  sampleId: string;
  updatedAt?: number;
}

export interface ProjectStore {
  loadActiveProject(): Promise<PersistedProjectDocument | null>;
  loadImportedSampleBlob(sampleId: string): Promise<Blob | null>;
  saveActiveProject(project: PersistedProjectDocument): Promise<void>;
  saveImportedSampleBlob(options: SaveImportedSampleBlobOptions): Promise<void>;
}

export function createPersistedProjectDocument({
  arrangementLengthBars,
  arrangementLoopRange,
  arrangementTracks,
  clipInstances,
  clips,
  masterMixerState,
  name,
  sampleMetas,
  savedAt = Date.now(),
  tempoBpm,
  trackMixerStates,
}: CreatePersistedProjectDocumentOptions): PersistedProjectDocument {
  return {
    arrangementLengthBars: normalizeArrangementLengthBars(arrangementLengthBars),
    arrangementLoopRange,
    arrangementTracks: [...arrangementTracks],
    clipInstances: [...clipInstances],
    clips: [...clips],
    id: ACTIVE_PROJECT_ID,
    masterMixerState: { ...masterMixerState },
    name,
    sampleMetas: [...sampleMetas],
    savedAt,
    tempoBpm,
    trackMixerStates: trackMixerStates.map((state) => ({ ...state })),
    version: PROJECT_DOCUMENT_VERSION,
  };
}

export function getImportedSampleIds(
  project: Pick<PersistedProjectDocument, "sampleMetas">,
): string[] {
  return project.sampleMetas
    .filter((sampleMeta) => sampleMeta.source.kind === "imported")
    .map((sampleMeta) => sampleMeta.id);
}

export function migratePersistedProjectDocument(
  value: unknown,
): PersistedProjectDocument | null {
  if (!isRecord(value) || value.version !== PROJECT_DOCUMENT_VERSION) {
    return null;
  }

  if (
    typeof value.id !== "string" ||
    typeof value.name !== "string" ||
    typeof value.savedAt !== "number" ||
    typeof value.tempoBpm !== "number" ||
    !Array.isArray(value.arrangementTracks) ||
    !Array.isArray(value.clipInstances) ||
    !Array.isArray(value.clips) ||
    !Array.isArray(value.sampleMetas) ||
    !Array.isArray(value.trackMixerStates) ||
    !isRecord(value.arrangementLoopRange) ||
    !isRecord(value.masterMixerState)
  ) {
    return null;
  }

  return {
    ...(value as unknown as PersistedProjectDocument),
    arrangementLengthBars:
      typeof value.arrangementLengthBars === "number"
        ? normalizeArrangementLengthBars(value.arrangementLengthBars)
        : DEFAULT_ARRANGEMENT_LENGTH_BARS,
  };
}

export function createIndexedDbProjectStore(
  databaseName = DATABASE_NAME,
): ProjectStore {
  return new IndexedDbProjectStore(databaseName);
}

class IndexedDbProjectStore implements ProjectStore {
  private databasePromise: Promise<IDBDatabase> | null = null;

  constructor(private readonly databaseName: string) {}

  async loadActiveProject(): Promise<PersistedProjectDocument | null> {
    const database = await this.getDatabase();
    const value = await getFromObjectStore(
      database,
      PROJECT_STORE_NAME,
      ACTIVE_PROJECT_ID,
    );

    return migratePersistedProjectDocument(value);
  }

  async saveActiveProject(project: PersistedProjectDocument): Promise<void> {
    const database = await this.getDatabase();

    await putIntoObjectStore(database, PROJECT_STORE_NAME, project);
  }

  async loadImportedSampleBlob(sampleId: string): Promise<Blob | null> {
    const database = await this.getDatabase();
    const value = await getFromObjectStore(
      database,
      SAMPLE_BLOB_STORE_NAME,
      sampleId,
    );

    if (!isImportedSampleBlobRecord(value)) {
      return null;
    }

    return value.blob;
  }

  async saveImportedSampleBlob({
    blob,
    fileName,
    mimeType,
    sampleId,
    updatedAt = Date.now(),
  }: SaveImportedSampleBlobOptions): Promise<void> {
    const database = await this.getDatabase();
    const record: ImportedSampleBlobRecord = {
      blob,
      fileName,
      mimeType,
      sampleId,
      updatedAt,
    };

    await putIntoObjectStore(database, SAMPLE_BLOB_STORE_NAME, record);
  }

  private getDatabase(): Promise<IDBDatabase> {
    this.databasePromise ??= openDatabase(this.databaseName);
    return this.databasePromise;
  }
}

function openDatabase(databaseName: string): Promise<IDBDatabase> {
  const indexedDb = window.indexedDB;

  if (!indexedDb) {
    return Promise.reject(new Error("IndexedDB is not available in this browser."));
  }

  return new Promise((resolve, reject) => {
    const request = indexedDb.open(databaseName, DATABASE_VERSION);

    request.onerror = () => {
      reject(request.error ?? new Error("Failed to open IndexedDB."));
    };
    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(PROJECT_STORE_NAME)) {
        database.createObjectStore(PROJECT_STORE_NAME, { keyPath: "id" });
      }

      if (!database.objectStoreNames.contains(SAMPLE_BLOB_STORE_NAME)) {
        database.createObjectStore(SAMPLE_BLOB_STORE_NAME, {
          keyPath: "sampleId",
        });
      }
    };
    request.onsuccess = () => {
      resolve(request.result);
    };
  });
}

function getFromObjectStore(
  database: IDBDatabase,
  storeName: string,
  key: IDBValidKey,
): Promise<unknown> {
  return withObjectStore(database, storeName, "readonly", (store) =>
    store.get(key),
  );
}

function putIntoObjectStore(
  database: IDBDatabase,
  storeName: string,
  value: unknown,
): Promise<void> {
  return withObjectStore(database, storeName, "readwrite", (store) =>
    store.put(value),
  ).then(() => undefined);
}

function withObjectStore<TResult>(
  database: IDBDatabase,
  storeName: string,
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<TResult>,
): Promise<TResult> {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    const request = run(store);

    request.onerror = () => {
      reject(request.error ?? new Error(`IndexedDB ${storeName} request failed.`));
    };
    request.onsuccess = () => {
      resolve(request.result);
    };
    transaction.onerror = () => {
      reject(
        transaction.error ?? new Error(`IndexedDB ${storeName} transaction failed.`),
      );
    };
  });
}

function isImportedSampleBlobRecord(
  value: unknown,
): value is ImportedSampleBlobRecord {
  return (
    isRecord(value) &&
    typeof value.sampleId === "string" &&
    value.blob instanceof Blob
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
