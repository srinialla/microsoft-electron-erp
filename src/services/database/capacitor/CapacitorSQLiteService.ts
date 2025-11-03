import type { DatabaseService, QueryFilter, QueryOptions } from '../interface/DatabaseService';
import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';

export class CapacitorSQLiteService implements DatabaseService {
    private dbName = 'erp_database';
    private db: any = null;
    private connection: SQLiteConnection | null = null;
    private isInitialized = false;

    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        if (Capacitor.getPlatform() === 'web') {
            throw new Error('CapacitorSQLiteService should not be used in web mode. Use IndexedDBService instead.');
        }

        try {
            this.connection = new SQLiteConnection(CapacitorSQLite);
            this.db = await this.connection.open({
                database: this.dbName,
                encrypted: false,
                mode: 'no-encryption',
                readonly: false,
            });

            // Create tables if they don't exist
            await this.executeScript(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'user',
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS activity_log (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          action TEXT NOT NULL,
          metadata TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY(user_id) REFERENCES users(id)
        );
      `);

            this.isInitialized = true;
        } catch (error) {
            console.error('Failed to initialize Capacitor SQLite:', error);
            throw error;
        }
    }

    private buildWhereClause(filters?: QueryFilter[]): { sql: string; params: any[] } {
        if (!filters || filters.length === 0) {
            return { sql: '', params: [] };
        }

        const conditions: string[] = [];
        const params: any[] = [];

        for (const filter of filters) {
            switch (filter.operator) {
                case 'equals':
                    conditions.push(`${filter.field} = ?`);
                    params.push(filter.value);
                    break;
                case 'contains':
                    conditions.push(`${filter.field} LIKE ?`);
                    params.push(`%${filter.value}%`);
                    break;
                case 'greaterThan':
                    conditions.push(`${filter.field} > ?`);
                    params.push(filter.value);
                    break;
                case 'lessThan':
                    conditions.push(`${filter.field} < ?`);
                    params.push(filter.value);
                    break;
                case 'between':
                    conditions.push(`${filter.field} BETWEEN ? AND ?`);
                    params.push(filter.value[0], filter.value[1]);
                    break;
                case 'in':
                    const placeholders = filter.value.map(() => '?').join(',');
                    conditions.push(`${filter.field} IN (${placeholders})`);
                    params.push(...filter.value);
                    break;
            }
        }

        return { sql: `WHERE ${conditions.join(' AND ')}`, params };
    }

    private buildOrderBy(orderBy?: { field: string; direction: 'asc' | 'desc' }[]): string {
        if (!orderBy || orderBy.length === 0) {
            return '';
        }
        const clauses = orderBy.map((o) => `${o.field} ${o.direction.toUpperCase()}`);
        return `ORDER BY ${clauses.join(', ')}`;
    }

    private buildLimit(limit?: number, offset?: number): string {
        if (!limit) return '';
        if (offset) {
            return `LIMIT ${limit} OFFSET ${offset}`;
        }
        return `LIMIT ${limit}`;
    }

    async insert<T>(table: string, data: T): Promise<number> {
        if (!this.db) throw new Error('Database not initialized');
        const keys = Object.keys(data).filter((k) => data[k as keyof T] !== undefined);
        const values = keys.map((k) => data[k as keyof T]);
        const placeholders = keys.map(() => '?').join(', ');

        const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
        const result = await this.db.run(sql, values);
        return result.changes.lastId || 0;
    }

    async bulkInsert<T>(table: string, data: T[]): Promise<number[]> {
        if (!this.db) throw new Error('Database not initialized');
        const ids: number[] = [];

        await this.beginTransaction();
        try {
            for (const item of data) {
                const id = await this.insert(table, item);
                ids.push(id);
            }
            await this.commit();
            return ids;
        } catch (error) {
            await this.rollback();
            throw error;
        }
    }

    async update<T>(table: string, id: number, data: Partial<T>): Promise<boolean> {
        if (!this.db) throw new Error('Database not initialized');
        const keys = Object.keys(data).filter((k) => data[k as keyof T] !== undefined);
        const values = [...keys.map((k) => data[k as keyof T]), id];
        const set = keys.map((key) => `${key} = ?`).join(', ');

        const sql = `UPDATE ${table} SET ${set} WHERE id = ?`;
        const result = await this.db.run(sql, values);
        return result.changes.changes > 0;
    }

    async delete(table: string, id: number): Promise<boolean> {
        if (!this.db) throw new Error('Database not initialized');
        const sql = `DELETE FROM ${table} WHERE id = ?`;
        const result = await this.db.run(sql, [id]);
        return result.changes.changes > 0;
    }

    async findById<T>(table: string, id: number): Promise<T | null> {
        if (!this.db) throw new Error('Database not initialized');
        const sql = `SELECT * FROM ${table} WHERE id = ?`;
        const result = await this.db.query(sql, [id]);
        return (result.values?.[0] as T) || null;
    }

    async findAll<T>(table: string, options?: QueryOptions): Promise<T[]> {
        if (!this.db) throw new Error('Database not initialized');
        let sql = `SELECT * FROM ${table}`;
        let params: any[] = [];

        if (options?.filters) {
            const where = this.buildWhereClause(options.filters);
            sql += ' ' + where.sql;
            params = where.params;
        }

        if (options?.orderBy) {
            sql += ' ' + this.buildOrderBy(options.orderBy);
        }

        if (options?.limit) {
            sql += ' ' + this.buildLimit(options.limit, options.offset);
        }

        const result = await this.db.query(sql, params);
        return (result.values || []) as T[];
    }

    async count(table: string, filters?: QueryFilter[]): Promise<number> {
        if (!this.db) throw new Error('Database not initialized');
        let sql = `SELECT COUNT(*) as count FROM ${table}`;
        let params: any[] = [];

        if (filters) {
            const where = this.buildWhereClause(filters);
            sql += ' ' + where.sql;
            params = where.params;
        }

        const result = await this.db.query(sql, params);
        return result.values?.[0]?.count || 0;
    }

    async query<T>(sql: string, params?: any[]): Promise<T[]> {
        if (!this.db) throw new Error('Database not initialized');
        const result = await this.db.query(sql, params || []);
        return (result.values || []) as T[];
    }

    async beginTransaction(): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');
        await this.db.execute('BEGIN TRANSACTION');
    }

    async commit(): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');
        await this.db.execute('COMMIT');
    }

    async rollback(): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');
        await this.db.execute('ROLLBACK');
    }

    async transaction<T>(callback: () => Promise<T>): Promise<T> {
        await this.beginTransaction();
        try {
            const result = await callback();
            await this.commit();
            return result;
        } catch (error) {
            await this.rollback();
            throw error;
        }
    }

    async executeScript(script: string): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');
        // Split by semicolon and execute each statement
        const statements = script
            .split(';')
            .map((s) => s.trim())
            .filter((s) => s.length > 0);
        for (const statement of statements) {
            await this.db.execute(statement);
        }
    }

    async close(): Promise<void> {
        if (this.connection && this.db) {
            await this.connection.close({ database: this.dbName });
            this.db = null;
            this.connection = null;
            this.isInitialized = false;
        }
    }
}

