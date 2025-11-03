import type { DatabaseService } from '../../../services/database/interface/DatabaseService';
import { getDatabaseService } from '../../../services/database/DatabaseFactory';
import type {
    Company,
    Branch,
    UnitOfMeasure,
} from '../../../shared/types/entities';

class SettingsService {
    private db: DatabaseService;

    constructor() {
        this.db = getDatabaseService();
    }

    // Company Profile
    async getCompany(): Promise<Company | null> {
        const companies = await this.db.findAll<Company>('companies');
        return companies.length > 0 ? companies[0] : null;
    }

    async updateCompany(data: Partial<Company>): Promise<boolean> {
        const company = await this.getCompany();
        if (company) {
            return await this.db.update('companies', company.id, {
                ...data,
                updated_at: new Date().toISOString(),
            });
        } else {
            // Create if doesn't exist
            const id = await this.db.insert('companies', {
                ...data,
                created_at: new Date().toISOString(),
            } as Company);
            return id > 0;
        }
    }

    // Branches
    async getBranches(): Promise<Branch[]> {
        return await this.db.findAll<Branch>('branches');
    }

    async createBranch(data: Omit<Branch, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
        return await this.db.insert('branches', data);
    }

    async updateBranch(id: number, data: Partial<Branch>): Promise<boolean> {
        return await this.db.update('branches', id, {
            ...data,
            updated_at: new Date().toISOString(),
        });
    }

    async deleteBranch(id: number): Promise<boolean> {
        // Check if branch has transactions
        const stock = await this.db.findAll('inventory_stock');
        const hasTransactions = stock.some((s: any) => s.branch_id === id);
        if (hasTransactions) {
            throw new Error('Cannot delete branch that has inventory transactions');
        }
        return await this.db.delete('branches', id);
    }

    // Units of Measure
    async getUnitsOfMeasure(): Promise<UnitOfMeasure[]> {
        return await this.db.findAll<UnitOfMeasure>('units_of_measure');
    }

    async createUnitOfMeasure(data: Omit<UnitOfMeasure, 'id' | 'created_at'>): Promise<number> {
        return await this.db.insert('units_of_measure', data);
    }

    async updateUnitOfMeasure(id: number, data: Partial<UnitOfMeasure>): Promise<boolean> {
        return await this.db.update('units_of_measure', id, data);
    }

    async deleteUnitOfMeasure(id: number): Promise<boolean> {
        // Check if unit is used in products
        const products = await this.db.findAll('products');
        const isUsed = products.some((p: any) => p.unit_of_measure_id === id);
        if (isUsed) {
            throw new Error('Cannot delete unit of measure that is used in products');
        }
        return await this.db.delete('units_of_measure', id);
    }

    // Tax Settings
    async getTaxSettings(): Promise<any[]> {
        return await this.db.findAll('tax_settings');
    }

    async createTaxSetting(data: any): Promise<number> {
        return await this.db.insert('tax_settings', data);
    }

    async updateTaxSetting(id: number, data: any): Promise<boolean> {
        return await this.db.update('tax_settings', id, data);
    }

    async deleteTaxSetting(id: number): Promise<boolean> {
        return await this.db.delete('tax_settings', id);
    }

    // Backup & Restore
    async exportData(): Promise<string> {
        // Export all tables to JSON
        const tables = [
            'companies',
            'branches',
            'customers',
            'vendors',
            'products',
            'sales_invoices',
            'purchase_orders',
            'chart_of_accounts',
            'journal_entries',
        ];

        const exportData: Record<string, any[]> = {};

        for (const table of tables) {
            try {
                const data = await this.db.findAll(table);
                exportData[table] = data;
            } catch (error) {
                console.error(`Failed to export ${table}:`, error);
            }
        }

        return JSON.stringify(exportData, null, 2);
    }

    async importData(jsonData: string): Promise<void> {
        const data = JSON.parse(jsonData);

        // Clear existing data (be careful in production!)
        // Then import new data
        for (const [table, records] of Object.entries(data)) {
            if (Array.isArray(records) && records.length > 0) {
                // In production, use transactions
                for (const record of records) {
                    try {
                        await this.db.insert(table, record);
                    } catch (error) {
                        console.error(`Failed to import record in ${table}:`, error);
                    }
                }
            }
        }
    }
}

export default new SettingsService();

