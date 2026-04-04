
import { openDB } from 'idb';

const DB_NAME = 'SankatSaathiDB';
const DB_VERSION = 1;

export const initDB = async () => {
    return openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
            // Store for latest AI intelligence status
            if (!db.objectStoreNames.contains('intelligence')) {
                db.createObjectStore('intelligence', { keyPath: 'id' });
            }
            // Store for offline alerts history
            if (!db.objectStoreNames.contains('alerts')) {
                db.createObjectStore('alerts', { keyPath: 'id' });
            }
            // Store for static safety guides
            if (!db.objectStoreNames.contains('guides')) {
                db.createObjectStore('guides', { keyPath: 'category' });
            }
        },
    });
};

export const saveIntelligenceState = async (state) => {
    try {
        const db = await initDB();
        await db.put('intelligence', { id: 'latest', ...state, cachedAt: Date.now() });
        return true;
    } catch (err) {
        console.error('IndexedDB Save Error:', err);
        return false;
    }
};

export const getCachedIntelligence = async () => {
    try {
        const db = await initDB();
        return await db.get('intelligence', 'latest');
    } catch (err) {
        console.error('IndexedDB Read Error:', err);
        return null;
    }
};

export const saveOfflineAlert = async (alert) => {
    try {
        const db = await initDB();
        await db.put('alerts', alert);
    } catch (e) {
        console.error(e);
    }
};

export const getOfflineAlerts = async () => {
    try {
        const db = await initDB();
        return await db.getAll('alerts');
    } catch (e) {
        return [];
    }
}
