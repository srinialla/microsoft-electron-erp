import type { DatabaseService } from '../interface/DatabaseService';
import { migration_001_initial_schema } from './001_initial_schema';

export interface Migration {
    id: string;
    version: number;
    name: string;
    up: (db: DatabaseService) => Promise<void>;
}

const migrations: Migration[] = [
    {
        id: '001',
        version: 1,
        name: 'Initial Schema',
        up: async (db: DatabaseService) => {
            // For IndexedDB, object stores are already created in initialize()
            // Only run SQL script for SQLite/Capacitor
            // Detect IndexedDB by attempting executeScript and catching the expected error
            try {
                await db.executeScript(migration_001_initial_schema);
            } catch (error: any) {
                // Robust error detection that works even after minification/bundling
                // Check multiple error representations
                const errorMessage = error?.message || '';
                const errorString = String(error || '');
                const errorStack = error?.stack || '';

                // Combine all error text for pattern matching
                const allErrorText = `${errorMessage} ${errorString} ${errorStack}`.toLowerCase();

                // Check for IndexedDB error indicators (works even if message is minified)
                // Any of these patterns indicate IndexedDB
                const isIndexedDBError =
                    allErrorText.includes('indexeddb') ||
                    allErrorText.includes('executeScript is not supported') ||
                    allErrorText.includes('schema migrations instead');

                if (isIndexedDBError) {
                    // This is expected for IndexedDB - stores are created during initialize()
                    // Migration complete - return without throwing
                    return;
                }

                // For any other error, re-throw it (real SQL errors, etc.)
                throw error;
            }
        },
    },
];

export class MigrationRunner {
    constructor(private db: DatabaseService) { }

    async runMigrations(): Promise<void> {
        const completed = await this.getCompletedMigrations();
        const pending = migrations.filter((m) => !completed.includes(m.id));

        if (pending.length === 0) {
            console.log('No pending migrations');
            return;
        }

        console.log(`Running ${pending.length} migration(s)...`);

        for (const migration of pending) {
            try {
                console.log(`Running migration ${migration.id}: ${migration.name}`);
                await migration.up(this.db);
                // Migration completed successfully (even if it was skipped for IndexedDB)
                await this.markMigrationComplete(migration.id);
                console.log(`✓ Migration ${migration.id} completed`);
            } catch (error) {
                console.error(`✗ Migration ${migration.id} failed:`, error);
                throw error;
            }
        }

        console.log('All migrations completed');
    }

    private isIndexedDB(): boolean {
        return this.db.constructor.name === 'IndexedDBService';
    }

    private async getCompletedMigrations(): Promise<string[]> {
        try {
            if (this.isIndexedDB()) {
                // For IndexedDB, use findAll instead of SQL query
                const rows = await this.db.findAll<{ id: string }>('_migrations');
                return rows.map((r) => r.id).sort();
            } else {
                // For SQLite/Capacitor, use SQL query
                const rows = await this.db.query<{ id: string }>('SELECT id FROM _migrations ORDER BY id');
                return rows.map((r) => r.id);
            }
        } catch (error) {
            // _migrations table/store doesn't exist yet - this is expected on first run
            await this.createMigrationsTable();
            return [];
        }
    }

    private async createMigrationsTable(): Promise<void> {
        if (this.isIndexedDB()) {
            // For IndexedDB, the _migrations store is created during initialize()
            // Just verify it exists by trying to query it
            try {
                await this.db.findAll('_migrations');
            } catch (error) {
                // Store doesn't exist yet - this is fine, it will be created on next initialize
                // For IndexedDB, stores are created via schema migrations in IndexedDBMigrations.ts
                console.log('IndexedDB: _migrations store will be created on next database version upgrade');
            }
        } else {
            // For SQLite/Capacitor, create the table using SQL
            try {
                await this.db.executeScript(`
          CREATE TABLE IF NOT EXISTS _migrations (
            id TEXT PRIMARY KEY,
            version INTEGER NOT NULL,
            name TEXT NOT NULL,
            executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);
            } catch (error) {
                // If executeScript fails, table might already exist or there's a real error
                console.error('Failed to create _migrations table:', error);
                throw error;
            }
        }
    }

    private async markMigrationComplete(migrationId: string): Promise<void> {
        const migration = migrations.find((m) => m.id === migrationId);
        if (!migration) return;

        try {
            await this.db.insert('_migrations', {
                id: migration.id,
                version: migration.version,
                name: migration.name,
                executed_at: new Date().toISOString(),
            });
        } catch (error) {
            // If insert fails, try update (in case migration was partially run)
            await this.db.update('_migrations', migration.id as any, {
                version: migration.version,
                name: migration.name,
                executed_at: new Date().toISOString(),
            });
        }
    }
}

