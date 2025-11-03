import type { DatabaseService } from '../../../services/database/interface/DatabaseService';
import { getDatabaseService } from '../../../services/database/DatabaseFactory';
import type {
    ChartOfAccount,
    JournalEntry,
    JournalEntryLine,
    BankAccount,
} from '../../../shared/types/entities';
import { generateDocumentNumber } from '../../../shared/utils/numberGenerator';

class AccountingService {
    private db: DatabaseService;

    constructor() {
        this.db = getDatabaseService();
    }

    // Chart of Accounts
    async getAccounts(): Promise<ChartOfAccount[]> {
        return await this.db.findAll<ChartOfAccount>('chart_of_accounts');
    }

    async createAccount(data: Omit<ChartOfAccount, 'id' | 'created_at'>): Promise<number> {
        return await this.db.insert('chart_of_accounts', data);
    }

    async updateAccount(id: number, data: Partial<ChartOfAccount>): Promise<boolean> {
        return await this.db.update('chart_of_accounts', id, data);
    }

    async deleteAccount(id: number): Promise<boolean> {
        // Check if account has transactions
        const entries = await this.db.findAll('journal_entry_lines');
        const hasTransactions = entries.some((line: any) => line.account_id === id);
        if (hasTransactions) {
            throw new Error('Cannot delete account that has transactions');
        }
        return await this.db.delete('chart_of_accounts', id);
    }

    // Journal Entries
    async createJournalEntry(data: {
        entry_date: string;
        description: string;
        lines: Array<{
            account_id: number;
            description?: string;
            debit_amount: number;
            credit_amount: number;
        }>;
    }): Promise<number> {
        const entryNumber = await generateDocumentNumber('JE', 'journal_entries', 'entry_number', this.db);

        // Validate: Total debits must equal total credits
        const totalDebit = data.lines.reduce((sum, line) => sum + line.debit_amount, 0);
        const totalCredit = data.lines.reduce((sum, line) => sum + line.credit_amount, 0);

        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            throw new Error('Total debits must equal total credits');
        }

        const entryData: Omit<JournalEntry, 'id' | 'created_at' | 'updated_at'> = {
            entry_number: entryNumber,
            entry_date: data.entry_date,
            entry_type: 'manual',
            description: data.description,
            total_debit: totalDebit,
            total_credit: totalCredit,
            status: 'posted',
        };

        const entryId = await this.db.insert('journal_entries', entryData);

        // Insert lines
        for (const [index, line] of data.lines.entries()) {
            await this.db.insert('journal_entry_lines', {
                entry_id: entryId,
                account_id: line.account_id,
                description: line.description,
                debit_amount: line.debit_amount,
                credit_amount: line.credit_amount,
                sequence: index + 1,
            });
        }

        return entryId;
    }

    async getJournalEntryById(id: number): Promise<JournalEntry | null> {
        return await this.db.findById<JournalEntry>('journal_entries', id);
    }

    async getJournalEntries(options?: {
        date_from?: string;
        date_to?: string;
    }): Promise<JournalEntry[]> {
        let entries = await this.db.findAll<JournalEntry>('journal_entries');

        if (options?.date_from) {
            entries = entries.filter((e) => e.entry_date >= options.date_from!);
        }

        if (options?.date_to) {
            entries = entries.filter((e) => e.entry_date <= options.date_to!);
        }

        return entries.sort((a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime());
    }

    async getJournalEntryLines(entryId: number): Promise<JournalEntryLine[]> {
        const all = await this.db.findAll<JournalEntryLine>('journal_entry_lines');
        return all.filter((line) => line.entry_id === entryId);
    }

    // Bank Accounts
    async getBankAccounts(): Promise<BankAccount[]> {
        return await this.db.findAll<BankAccount>('bank_accounts');
    }

    async createBankAccount(data: Omit<BankAccount, 'id' | 'created_at' | 'current_balance'>): Promise<number> {
        const accountData = {
            ...data,
            current_balance: data.opening_balance,
        };
        return await this.db.insert('bank_accounts', accountData);
    }

    async updateBankAccount(id: number, data: Partial<BankAccount>): Promise<boolean> {
        return await this.db.update('bank_accounts', id, data);
    }

    // Trial Balance
    async getTrialBalance(date?: string): Promise<Array<{
        account_id: number;
        account_name: string;
        account_code: string;
        debit: number;
        credit: number;
    }>> {
        const accounts = await this.getAccounts();
        const entries = await this.getJournalEntries(
            date ? { date_to: date } : undefined
        );

        const accountBalances: Record<number, { debit: number; credit: number }> = {};

        // Initialize all accounts
        accounts.forEach((acc) => {
            accountBalances[acc.id] = { debit: 0, credit: 0 };
        });

        // Calculate balances from journal entries
        for (const entry of entries) {
            const lines = await this.getJournalEntryLines(entry.id);
            for (const line of lines) {
                if (!accountBalances[line.account_id]) {
                    accountBalances[line.account_id] = { debit: 0, credit: 0 };
                }
                accountBalances[line.account_id].debit += line.debit_amount;
                accountBalances[line.account_id].credit += line.credit_amount;
            }
        }

        return accounts.map((acc) => ({
            account_id: acc.id,
            account_name: acc.account_name,
            account_code: acc.account_code,
            debit: accountBalances[acc.id]?.debit || 0,
            credit: accountBalances[acc.id]?.credit || 0,
        }));
    }
}

export default new AccountingService();

