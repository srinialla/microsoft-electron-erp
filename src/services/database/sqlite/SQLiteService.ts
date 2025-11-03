import type { DatabaseService, QueryFilter, QueryOptions } from '../interface/DatabaseService';

export class SQLiteService implements DatabaseService {
    private isWeb: boolean;

    constructor() {
        this.isWeb = typeof window !== 'undefined' && window.api?.app?.platform === 'web';
    }

    async initialize(): Promise<void> {
        // SQLite is initialized in Electron main process
        // For web mode, this should not be called
        if (this.isWeb) {
            throw new Error('SQLiteService should not be used in web mode. Use IndexedDBService instead.');
        }
    }

    private async executeQuery<T>(sql: string, params?: any[]): Promise<T[]> {
        if (!window.api?.dbQuery) {
            throw new Error('Database API not available');
        }
        const response = await window.api.dbQuery({ type: 'query', sql, params: params ?? [] });
        if (!response.ok) {
            throw new Error(response.error || 'Query failed');
        }
        return response.rows as T[];
    }

    private async executeRun(sql: string, params?: any[]): Promise<{ changes: number; lastInsertRowid: number }> {
        if (!window.api?.dbQuery) {
            throw new Error('Database API not available');
        }
        const response = await window.api.dbQuery({ type: 'run', sql, params: params ?? [] });
        if (!response.ok) {
            throw new Error(response.error || 'Execute failed');
        }
        return { changes: response.changes || 0, lastInsertRowid: response.lastInsertRowid || 0 };
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
        const keys = Object.keys(data).filter((k) => data[k as keyof T] !== undefined);
        const values = keys.map((k) => data[k as keyof T]);
        const placeholders = keys.map(() => '?').join(', ');
        const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
        const result = await this.executeRun(sql, values);
        return result.lastInsertRowid;
    }

    async bulkInsert<T>(table: string, data: T[]): Promise<number[]> {
        if (data.length === 0) return [];
        const keys = Object.keys(data[0]).filter((k) => data[0][k as keyof T] !== undefined);
        const placeholders = keys.map(() => '?').join(', ');
        const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
        const ids: number[] = [];

        await this.beginTransaction();
        try {
            for (const row of data) {
                const values = keys.map((k) => row[k as keyof T]);
                const result = await this.executeRun(sql, values);
                ids.push(result.lastInsertRowid);
            }
            await this.commit();
            return ids;
        } catch (error) {
            await this.rollback();
            throw error;
        }
    }

    async update<T>(table: string, id: number, data: Partial<T>): Promise<boolean> {
        const keys = Object.keys(data).filter((k) => data[k as keyof T] !== undefined);
        if (keys.length === 0) return false;
        const sets = keys.map((k) => `${k} = ?`).join(', ');
        const values = keys.map((k) => data[k as keyof T]);
        values.push(id);
        const sql = `UPDATE ${table} SET ${sets} WHERE id = ?`;
        const result = await this.executeRun(sql, values);
        return result.changes > 0;
    }

    async delete(table: string, id: number): Promise<boolean> {
        const sql = `DELETE FROM ${table} WHERE id = ?`;
        const result = await this.executeRun(sql, [id]);
        return result.changes > 0;
    }

    async findById<T>(table: string, id: number): Promise<T | null> {
        const sql = `SELECT * FROM ${table} WHERE id = ? LIMIT 1`;
        const rows = await this.executeQuery<T>(sql, [id]);
        return rows.length > 0 ? rows[0] : null;
    }

    async findAll<T>(table: string, options?: QueryOptions): Promise<T[]> {
        let sql = `SELECT * FROM ${table}`;
        const params: any[] = [];

        if (options?.filters) {
            const where = this.buildWhereClause(options.filters);
            sql += ` ${where.sql}`;
            params.push(...where.params);
        }

        if (options?.orderBy) {
            sql += ` ${this.buildOrderBy(options.orderBy)}`;
        }

        if (options?.limit || options?.offset) {
            sql += ` ${this.buildLimit(options.limit, options.offset)}`;
        }

        return this.executeQuery<T>(sql, params);
    }

    async count(table: string, filters?: QueryFilter[]): Promise<number> {
        let sql = `SELECT COUNT(*) as count FROM ${table}`;
        const params: any[] = [];

        if (filters) {
            const where = this.buildWhereClause(filters);
            sql += ` ${where.sql}`;
            params.push(...where.params);
        }

        const rows = await this.executeQuery<{ count: number }>(sql, params);
        return rows[0]?.count ?? 0;
    }

    async query<T>(sql: string, params?: any[]): Promise<T[]> {
        return this.executeQuery<T>(sql, params);
    }

    private transactionActive = false;

    async beginTransaction(): Promise<void> {
        if (this.transactionActive) {
            throw new Error('Transaction already active');
        }
        await this.executeQuery('BEGIN TRANSACTION');
        this.transactionActive = true;
    }

    async commit(): Promise<void> {
        if (!this.transactionActive) {
            throw new Error('No active transaction');
        }
        await this.executeQuery('COMMIT');
        this.transactionActive = false;
    }

    async rollback(): Promise<void> {
        if (!this.transactionActive) {
            throw new Error('No active transaction');
        }
        await this.executeQuery('ROLLBACK');
        this.transactionActive = false;
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
        // Split by semicolon and execute each statement
        const statements = script
            .split(';')
            .map((s) => s.trim())
            .filter((s) => s.length > 0);

        await this.beginTransaction();
        try {
            for (const statement of statements) {
                await this.executeQuery(statement);
            }
            await this.commit();
        } catch (error) {
            await this.rollback();
            throw error;
        }
    }

    async close(): Promise<void> {
        // SQLite connection is managed by Electron main process
        // No action needed here
    }
}

