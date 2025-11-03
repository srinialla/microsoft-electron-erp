import type { DatabaseService } from './interface/DatabaseService';
import { SQLiteService } from './sqlite/SQLiteService';
import { IndexedDBService } from './indexeddb/IndexedDBService';
import { CapacitorSQLiteService } from './capacitor/CapacitorSQLiteService';

let instance: DatabaseService | null = null;

async function detectPlatform(): Promise<'mobile' | 'desktop' | 'web'> {
    if (typeof window === 'undefined') {
        return 'web';
    }

    // Check if Capacitor is available (mobile)
    const isCapacitor = (window as any).Capacitor !== undefined;
    if (isCapacitor) {
        try {
            const { Capacitor } = await import('@capacitor/core');
            const platform = Capacitor.getPlatform();
            if (platform === 'android' || platform === 'ios') {
                return 'mobile';
            }
        } catch {
            // Capacitor import failed, fall through
        }
    }

    // Check if Electron API is available (desktop)
    const isElectron = window.api?.app?.platform !== 'web' &&
        window.api?.app?.platform !== undefined &&
        typeof (window as any).electron !== 'undefined';
    if (isElectron) {
        return 'desktop';
    }

    // Default to web
    return 'web';
}

export function getDatabaseService(): DatabaseService {
    if (instance) {
        return instance;
    }

    // Synchronous detection for immediate use
    // For Capacitor, we'll initialize asynchronously in initDatabase
    if (typeof window !== 'undefined') {
        const isCapacitor = (window as any).Capacitor !== undefined;
        if (isCapacitor) {
            // Initialize Capacitor SQLite service (will be async in initDatabase)
            instance = new CapacitorSQLiteService();
            return instance;
        }

        const isElectron = window.api?.app?.platform !== 'web' &&
            window.api?.app?.platform !== undefined &&
            typeof (window as any).electron !== 'undefined';
        if (isElectron) {
            instance = new SQLiteService();
            return instance;
        }
    }

    // Default to IndexedDB for web
    instance = new IndexedDBService();
    return instance;
}

export async function initializeDatabase(): Promise<DatabaseService> {
    const db = getDatabaseService();
    await db.initialize();
    return db;
}

