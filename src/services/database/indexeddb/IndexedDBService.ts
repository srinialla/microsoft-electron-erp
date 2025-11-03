import type { DatabaseService, QueryFilter, QueryOptions } from '../interface/DatabaseService';
import { createIndexedDBStores } from './IndexedDBMigrations';

const DB_NAME = 'erp_database';
const DB_VERSION = 1;

export class IndexedDBService implements DatabaseService {
    private db: IDBDatabase | null = null;
    private isInitialized = false;

    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                reject(new Error(`IndexedDB open error: ${request.error}`));
            };

            request.onsuccess = () => {
                this.db = request.result;
                this.isInitialized = true;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                // Create all object stores from schema
                createIndexedDBStores(db);
            };
        });
    }

    private getStore(table: string, mode: IDBTransactionMode = 'readonly'): IDBObjectStore {
        if (!this.db) {
            throw new Error('Database not initialized');
        }
        const transaction = this.db.transaction([table], mode);
        return transaction.objectStore(table);
    }

    private matchesFilter(item: any, filter: QueryFilter): boolean {
        const value = item[filter.field];
        switch (filter.operator) {
            case 'equals':
                return value === filter.value;
            case 'contains':
                return String(value || '').toLowerCase().includes(String(filter.value || '').toLowerCase());
            case 'greaterThan':
                return value > filter.value;
            case 'lessThan':
                return value < filter.value;
            case 'between':
                return value >= filter.value[0] && value <= filter.value[1];
            case 'in':
                return Array.isArray(filter.value) && filter.value.includes(value);
            default:
                return true;
        }
    }

    async insert<T>(table: string, data: T): Promise<number> {
        await this.ensureStore(table);

        return new Promise((resolve, reject) => {
            const store = this.getStore(table, 'readwrite');
            const request = store.add(data as any);

            request.onsuccess = () => {
                resolve(request.result as number);
            };

            request.onerror = () => {
                reject(new Error(`Insert failed: ${request.error}`));
            };
        });
    }

    async bulkInsert<T>(table: string, data: T[]): Promise<number[]> {
        await this.ensureStore(table);

        return new Promise((resolve, reject) => {
            const store = this.getStore(table, 'readwrite');
            const ids: number[] = [];
            let completed = 0;

            if (data.length === 0) {
                resolve([]);
                return;
            }

            for (const item of data) {
                const request = store.add(item as any);
                request.onsuccess = () => {
                    ids.push(request.result as number);
                    completed++;
                    if (completed === data.length) {
                        resolve(ids);
                    }
                };
                request.onerror = () => {
                    reject(new Error(`Bulk insert failed: ${request.error}`));
                };
            }
        });
    }

    async update<T>(table: string, id: number, data: Partial<T>): Promise<boolean> {
        const existing = await this.findById<T>(table, id);
        if (!existing) return false;

        return new Promise((resolve, reject) => {
            const store = this.getStore(table, 'readwrite');
            const updated = { ...existing, ...data, id };
            const request = store.put(updated);

            request.onsuccess = () => {
                resolve(true);
            };

            request.onerror = () => {
                reject(new Error(`Update failed: ${request.error}`));
            };
        });
    }

    async delete(table: string, id: number): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const store = this.getStore(table, 'readwrite');
            const request = store.delete(id);

            request.onsuccess = () => {
                resolve(true);
            };

            request.onerror = () => {
                reject(new Error(`Delete failed: ${request.error}`));
            };
        });
    }

    async findById<T>(table: string, id: number): Promise<T | null> {
        return new Promise((resolve, reject) => {
            const store = this.getStore(table);
            const request = store.get(id);

            request.onsuccess = () => {
                resolve((request.result as T) || null);
            };

            request.onerror = () => {
                reject(new Error(`FindById failed: ${request.error}`));
            };
        });
    }

    async findAll<T>(table: string, options?: QueryOptions): Promise<T[]> {
        return new Promise((resolve, reject) => {
            const store = this.getStore(table);
            const request = store.getAll();

            request.onsuccess = () => {
                let results = (request.result as T[]) || [];

                // Apply filters
                if (options?.filters && options.filters.length > 0) {
                    results = results.filter((item) =>
                        options.filters!.every((filter) => this.matchesFilter(item, filter))
                    );
                }

                // Apply sorting
                if (options?.orderBy && options.orderBy.length > 0) {
                    results.sort((a, b) => {
                        for (const order of options.orderBy!) {
                            const aVal = a[order.field as keyof T];
                            const bVal = b[order.field as keyof T];
                            if (aVal !== bVal) {
                                const comparison = aVal > bVal ? 1 : -1;
                                return order.direction === 'asc' ? comparison : -comparison;
                            }
                        }
                        return 0;
                    });
                }

                // Apply pagination
                if (options?.offset) {
                    results = results.slice(options.offset);
                }
                if (options?.limit) {
                    results = results.slice(0, options.limit);
                }

                resolve(results);
            };

            request.onerror = () => {
                reject(new Error(`FindAll failed: ${request.error}`));
            };
        });
    }

    async count(table: string, filters?: QueryFilter[]): Promise<number> {
        const all = await this.findAll<any>(table, { filters });
        return all.length;
    }

    async query<T>(sql: string, params?: any[]): Promise<T[]> {
        // IndexedDB doesn't support SQL, so we parse basic SELECT queries
        // This is a simplified implementation - for complex queries, use findAll with QueryOptions
        if (sql.trim().toUpperCase().startsWith('SELECT')) {
            // Extract table name from SELECT * FROM table_name
            const match = sql.match(/FROM\s+(\w+)/i);
            if (match) {
                const table = match[1];
                return this.findAll<T>(table);
            }
        }
        throw new Error('Complex SQL queries are not supported in IndexedDB. Use findAll() with QueryOptions instead.');
    }

    private async ensureStore(table: string): Promise<void> {
        if (!this.db) {
            await this.initialize();
        }
        if (!this.db) {
            throw new Error('Database not initialized');
        }

        // Create store if it doesn't exist
        if (!this.db.objectStoreNames.contains(table)) {
            // This would require a migration - for now, we'll throw an error
            // Schema migrations should create all stores
            throw new Error(`Object store "${table}" does not exist. Run migrations first.`);
        }
    }

    async beginTransaction(): Promise<void> {
        // IndexedDB transactions are implicit - this is a no-op
        // Transactions are handled automatically when accessing stores
    }

    async commit(): Promise<void> {
        // IndexedDB transactions are implicit - this is a no-op
    }

    async rollback(): Promise<void> {
        // IndexedDB transactions auto-rollback on error - this is a no-op
    }

    async transaction<T>(callback: () => Promise<T>): Promise<T> {
        // Execute callback - IndexedDB handles transactions automatically
        return callback();
    }

    async executeScript(script: string): Promise<void> {
        // IndexedDB doesn't support SQL scripts
        // This should be handled by schema migrations that create object stores
        throw new Error('executeScript is not supported in IndexedDB. Use schema migrations instead.');
    }

    async close(): Promise<void> {
        if (this.db) {
            this.db.close();
            this.db = null;
            this.isInitialized = false;
        }
    }
}

