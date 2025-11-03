export interface QueryFilter {
    field: string;
    operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan' | 'between' | 'in';
    value: any;
}

export interface QueryOptions {
    filters?: QueryFilter[];
    orderBy?: { field: string; direction: 'asc' | 'desc' }[];
    limit?: number;
    offset?: number;
}

export interface DatabaseService {
    initialize(): Promise<void>;
    insert<T>(table: string, data: T): Promise<number>;
    bulkInsert<T>(table: string, data: T[]): Promise<number[]>;
    update<T>(table: string, id: number, data: Partial<T>): Promise<boolean>;
    delete(table: string, id: number): Promise<boolean>;
    findById<T>(table: string, id: number): Promise<T | null>;
    findAll<T>(table: string, options?: QueryOptions): Promise<T[]>;
    count(table: string, filters?: QueryFilter[]): Promise<number>;
    query<T>(sql: string, params?: any[]): Promise<T[]>;
    beginTransaction(): Promise<void>;
    commit(): Promise<void>;
    rollback(): Promise<void>;
    transaction<T>(callback: () => Promise<T>): Promise<T>;
    executeScript(script: string): Promise<void>;
    close(): Promise<void>;
}

