/**
 * Persistent storage for recorded chunks in an IndexedDb Object Store
 */

import * as idb from 'idb';

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
    private currentId: number;

    constructor() {
        // TODO somehow use db.ObjectStore.count() do initialize the index from the last session so we can resume recording if the db already has data

        this.currentId = 0;
        this.dbPromise = idb.openDB<RecordingDB>(name, SCHEMA_VERSION, {
            upgrade(db, oldVersion, newVersion, transaction) {
                if (!db.objectStoreNames.contains(recordingStoreName)) {
                    // instead of 'autoincrement: true' we will manage the key ourselves so we can return its value
                    db.createObjectStore(recordingStoreName, {});
                }
            }
        });
    }

    async add(chunk: Blob) {
        const db = await this.dbPromise;
        const tx = db.transaction(recordingStoreName, 'readwrite');
        await tx.objectStore(recordingStoreName).put(chunk, this.currentId++);
        console.log(`Stored blob index ${this.currentId - 1} of size ${chunk.size}`);
        // TODO: Is it enough to await put, or do we need to await tx.oncomplete?
        // This answer will depend on how this lib abstracts it https://github.com/jakearchibald/idb
    }

    async getAll() {
        const db = await this.dbPromise;
        const tx = db.transaction(recordingStoreName, 'readonly');
        const store = tx.objectStore(recordingStoreName);
        return store.getAll();
    }

    async delete() {
        // const db = await this.dbPromise;
        await idb.deleteDB(recordingStoreName);
        // const tx = db.transaction(recordingStoreName, 'readwrite');
        // db.deleteObjectStore(recordingStoreName);
    }

    get length() {
        return this.currentId;
    }
}
