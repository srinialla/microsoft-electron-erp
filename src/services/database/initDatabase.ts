import { initializeDatabase } from './DatabaseFactory';
import { MigrationRunner } from './migrations/MigrationRunner';

let dbInitialized = false;
let initializationPromise: Promise<void> | null = null;

/**
 * Initialize the database and run migrations
 * This should be called once at app startup
 */
export async function initDatabase(): Promise<void> {
    if (dbInitialized) {
        return;
    }

    if (initializationPromise) {
        return initializationPromise;
    }

    initializationPromise = (async () => {
        try {
            console.log('Initializing database...');
            const db = await initializeDatabase();

            console.log('Running migrations...');
            const runner = new MigrationRunner(db);
            await runner.runMigrations();

            dbInitialized = true;
            console.log('Database initialized successfully');
        } catch (error) {
            console.error('Database initialization failed:', error);
            throw error;
        } finally {
            initializationPromise = null;
        }
    })();

    return initializationPromise;
}

/**
 * Check if database is initialized
 */
export function isDatabaseInitialized(): boolean {
    return dbInitialized;
}

