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
    // In Electron, window.electron exists and platform is a Node.js platform (not 'web')
    const isElectron = typeof (window as any).electron !== 'undefined' &&
        window.api?.app?.platform !== undefined;
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

    // Synchronous detection for immediate use (fallback)
    // Proper detection happens in initializeDatabase()
    if (typeof window !== 'undefined') {
        // Check for Electron first (most reliable)
        const isElectron = typeof (window as any).electron !== 'undefined' &&
            window.api?.app?.platform !== undefined;
        if (isElectron) {
            instance = new SQLiteService();
            return instance;
        }
    }

    // Default to IndexedDB for web (safest default)
    // If it's actually mobile, initializeDatabase() will fix it
    instance = new IndexedDBService();
    return instance;
}

export async function initializeDatabase(): Promise<DatabaseService> {
    // Use async platform detection to get the correct service
    const platform = await detectPlatform();

    // Check if we need to create a new instance or switch to a different one
    let needsNewInstance = false;

    if (!instance) {
        needsNewInstance = true;
    } else {
        // Check if the current instance matches the detected platform
        const isMobileService = instance instanceof CapacitorSQLiteService;
        const isDesktopService = instance instanceof SQLiteService;
        const isWebService = instance instanceof IndexedDBService;

        if ((platform === 'mobile' && !isMobileService) ||
            (platform === 'desktop' && !isDesktopService) ||
            (platform === 'web' && !isWebService)) {
            needsNewInstance = true;
        }
    }

    if (needsNewInstance) {
        // Create the correct service based on detected platform
        switch (platform) {
            case 'mobile':
                instance = new CapacitorSQLiteService();
                break;
            case 'desktop':
                instance = new SQLiteService();
                break;
            case 'web':
            default:
                instance = new IndexedDBService();
                break;
        }
    }

    if (!instance) {
        // Fallback: should never happen, but TypeScript needs this check
        instance = new IndexedDBService();
    }

    await instance.initialize();
    return instance;
}

