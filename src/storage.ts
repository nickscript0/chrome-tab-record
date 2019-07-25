/**
 * Persistent storage for recorded chunks in an IndexedDb Object Store
 */

import * as idb from 'idb';
import { nn } from './types';

const SCHEMA_VERSION = 1;
const recordingStoreName = 'recordingStorage';

interface RecordingDB extends idb.DBSchema {
    'recordingStorage': {
        key: number,
        value: Blob,
    };
}

export class RecordingStorage {
    private dbPromise: Promise<idb.IDBPDatabase<RecordingDB>>;
    // private currentId: number;
    private runningSizeBytes: number;

    // Set to true to prevent any more add() calls from writing to memory
    // private finished: boolean;

    constructor() {
        // TODO somehow use db.ObjectStore.count() do initialize the index from the last session so we can resume recording if the db already has data

        // this.currentId = 0;
        // this.finished = false;
        this.runningSizeBytes = 0;
        this.dbPromise = idb.openDB<RecordingDB>(name, SCHEMA_VERSION, {
            upgrade(db, oldVersion, newVersion, transaction) {
                if (!db.objectStoreNames.contains(recordingStoreName)) {
                    // instead of 'autoincrement: true' we will manage the key ourselves so we can return its value
                    db.createObjectStore(recordingStoreName, {});
                }
            }
        });
    }

    async count() {
        const db = await this.dbPromise;
        return db.count(recordingStoreName);
    }

    async add(chunk: Blob) {
        // if (this.finished) {
        //     console.log(`storage.add: finished is true skipping chunk!`);
        //     return;
        // }
        const db = await this.dbPromise;
        const currentId = await db.count(recordingStoreName);
        const tx = db.transaction(recordingStoreName, 'readwrite');
        await tx.objectStore(recordingStoreName).put(chunk, currentId);
        this.runningSizeBytes += chunk.size;
        return { currentId, chunkSize: chunk.size };
        // TODO: Is it enough to await put, or do we need to await tx.oncomplete?
        // This answer will depend on how this lib abstracts it https://github.com/jakearchibald/idb
    }

    async getAll() {
        const db = await this.dbPromise;
        const tx = db.transaction(recordingStoreName, 'readonly');
        const store = tx.objectStore(recordingStoreName);
        return store.getAll();
    }

    async clear() {
        const db = await this.dbPromise;
        db.clear(recordingStoreName);
        // await idb.deleteDB(recordingStoreName);
        // const tx = db.transaction(recordingStoreName, 'readwrite');
        // db.deleteObjectStore(recordingStoreName);
    }

    // This still doesn't work, likely because async is waiting for user input
    async finish() {
        // this.finished = true;
        await this.clear();
    }
}
