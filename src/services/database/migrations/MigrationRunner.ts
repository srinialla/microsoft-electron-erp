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
            // Check if this is IndexedDB (stores are created during initialize)
            const isIndexedDB = db.constructor.name === 'IndexedDBService';

            if (!isIndexedDB) {
                // SQLite - execute SQL script
                await db.executeScript(migration_001_initial_schema);
            }
            // For IndexedDB, object stores are already created in initialize()
            // No additional action needed
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
                await this.markMigrationComplete(migration.id);
                console.log(`✓ Migration ${migration.id} completed`);
            } catch (error) {
                console.error(`✗ Migration ${migration.id} failed:`, error);
                throw error;
            }
        }

        console.log('All migrations completed');
    }

    private async getCompletedMigrations(): Promise<string[]> {
        try {
            const rows = await this.db.query<{ id: string }>('SELECT id FROM _migrations ORDER BY id');
            return rows.map((r) => r.id);
        } catch (error) {
            // _migrations table doesn't exist yet - this is expected on first run
            await this.createMigrationsTable();
            return [];
        }
    }

    private async createMigrationsTable(): Promise<void> {
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
            // For IndexedDB, the _migrations store is created during initialize()
            // If it doesn't exist, try to insert a dummy record to ensure store exists
            try {
                await this.db.insert('_migrations', {
                    id: '__init__',
                    version: 0,
                    name: 'Initial Migration Table',
                    executed_at: new Date().toISOString(),
                });
                // Delete the dummy record
                await this.db.delete('_migrations', '__init__' as any);
            } catch {
                // Store doesn't exist yet, will be created on next initialize
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

