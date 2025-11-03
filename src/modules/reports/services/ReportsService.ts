import type { DatabaseService } from '../../../services/database/interface/DatabaseService';
import { getDatabaseService } from '../../../services/database/DatabaseFactory';
import type {
    SalesInvoice,
    SalesInvoiceItem,
    PurchaseOrder,
    Product,
    Customer,
    Vendor,
} from '../../../shared/types/entities';

export interface SalesSummaryData {
    total_sales: number;
    total_cost: number;
    total_profit: number;
    profit_margin: number;
    invoice_count: number;
    average_invoice: number;
}

export interface SalesByCustomerData {
    customer_id: number;
    customer_name: string;
    total_sales: number;
    invoice_count: number;
    average_invoice: number;
}

export interface SalesByProductData {
    product_id: number;
    product_name: string;
    quantity_sold: number;
    total_sales: number;
    total_cost: number;
    profit: number;
}

class ReportsService {
    private db: DatabaseService;

    constructor() {
        this.db = getDatabaseService();
    }

    async getSalesSummary(
        dateFrom?: string,
        dateTo?: string,
        customerId?: number
    ): Promise<SalesSummaryData> {
        const invoices = await this.db.findAll<SalesInvoice>('sales_invoices');
        const invoiceItems = await this.db.findAll<SalesInvoiceItem>('sales_invoice_items');
        const products = await this.db.findAll<Product>('products');

        let filteredInvoices = invoices.filter(
            (inv) =>
                inv.status !== 'cancelled' &&
                inv.status !== 'void' &&
                (!dateFrom || inv.invoice_date >= dateFrom) &&
                (!dateTo || inv.invoice_date <= dateTo) &&
                (!customerId || inv.customer_id === customerId)
        );

        const totalSales = filteredInvoices.reduce((sum, inv) => sum + inv.grand_total, 0);
        const invoiceCount = filteredInvoices.length;

        // Calculate cost
        let totalCost = 0;
        for (const inv of filteredInvoices) {
            const items = invoiceItems.filter((item) => item.invoice_id === inv.id);
            for (const item of items) {
                const product = products.find((p) => p.id === item.product_id);
                if (product) {
                    totalCost += product.cost_price * item.quantity;
                }
            }
        }

        const totalProfit = totalSales - totalCost;
        const profitMargin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;
        const averageInvoice = invoiceCount > 0 ? totalSales / invoiceCount : 0;

        return {
            total_sales: totalSales,
            total_cost: totalCost,
            total_profit: totalProfit,
            profit_margin: profitMargin,
            invoice_count: invoiceCount,
            average_invoice: averageInvoice,
        };
    }

    async getSalesByCustomer(
        dateFrom?: string,
        dateTo?: string
    ): Promise<SalesByCustomerData[]> {
        const invoices = await this.db.findAll<SalesInvoice>('sales_invoices');
        const customers = await this.db.findAll<Customer>('customers');

        const filteredInvoices = invoices.filter(
            (inv) =>
                inv.status !== 'cancelled' &&
                inv.status !== 'void' &&
                (!dateFrom || inv.invoice_date >= dateFrom) &&
                (!dateTo || inv.invoice_date <= dateTo)
        );

        const customerMap: Record<number, SalesByCustomerData> = {};

        for (const inv of filteredInvoices) {
            if (!customerMap[inv.customer_id]) {
                const customer = customers.find((c) => c.id === inv.customer_id);
                customerMap[inv.customer_id] = {
                    customer_id: inv.customer_id,
                    customer_name: customer?.display_name || `Customer ${inv.customer_id}`,
                    total_sales: 0,
                    invoice_count: 0,
                    average_invoice: 0,
                };
            }

            customerMap[inv.customer_id].total_sales += inv.grand_total;
            customerMap[inv.customer_id].invoice_count += 1;
        }

        // Calculate averages
        Object.values(customerMap).forEach((data) => {
            data.average_invoice = data.invoice_count > 0 ? data.total_sales / data.invoice_count : 0;
        });

        return Object.values(customerMap).sort((a, b) => b.total_sales - a.total_sales);
    }

    async getSalesByProduct(
        dateFrom?: string,
        dateTo?: string
    ): Promise<SalesByProductData[]> {
        const invoices = await this.db.findAll<SalesInvoice>('sales_invoices');
        const invoiceItems = await this.db.findAll<SalesInvoiceItem>('sales_invoice_items');
        const products = await this.db.findAll<Product>('products');

        const filteredInvoices = invoices.filter(
            (inv) =>
                inv.status !== 'cancelled' &&
                inv.status !== 'void' &&
                (!dateFrom || inv.invoice_date >= dateFrom) &&
                (!dateTo || inv.invoice_date <= dateTo)
        );

        const invoiceIds = new Set(filteredInvoices.map((inv) => inv.id));

        const productMap: Record<number, SalesByProductData> = {};

        for (const item of invoiceItems) {
            if (!invoiceIds.has(item.invoice_id)) continue;

            if (!productMap[item.product_id]) {
                const product = products.find((p) => p.id === item.product_id);
                productMap[item.product_id] = {
                    product_id: item.product_id,
                    product_name: product?.name || `Product ${item.product_id}`,
                    quantity_sold: 0,
                    total_sales: 0,
                    total_cost: 0,
                    profit: 0,
                };
            }

            const product = products.find((p) => p.id === item.product_id);
            productMap[item.product_id].quantity_sold += item.quantity;
            productMap[item.product_id].total_sales += item.line_total;
            if (product) {
                productMap[item.product_id].total_cost += product.cost_price * item.quantity;
            }
        }

        // Calculate profit
        Object.values(productMap).forEach((data) => {
            data.profit = data.total_sales - data.total_cost;
        });

        return Object.values(productMap).sort((a, b) => b.total_sales - a.total_sales);
    }

    async getIncomeStatement(
        dateFrom?: string,
        dateTo?: string
    ): Promise<{
        revenue: number;
        cogs: number;
        gross_profit: number;
        expenses: number;
        net_income: number;
    }> {
        const salesSummary = await this.getSalesSummary(dateFrom, dateTo);

        // For expenses, we'd typically query journal entries or expense accounts
        // For now, using a simplified calculation
        const expenses = 0; // Would calculate from expense accounts

        const revenue = salesSummary.total_sales;
        const cogs = salesSummary.total_cost;
        const gross_profit = revenue - cogs;
        const net_income = gross_profit - expenses;

        return {
            revenue,
            cogs,
            gross_profit,
            expenses,
            net_income,
        };
    }

    async getBalanceSheet(asOfDate?: string): Promise<{
        assets: number;
        liabilities: number;
        equity: number;
        total: number;
    }> {
        // Simplified balance sheet calculation
        // In production, would query chart of accounts by type
        const assets = 0;
        const liabilities = 0;
        const equity = 0;
        const total = assets + liabilities + equity;

        return {
            assets,
            liabilities,
            equity,
            total,
        };
    }

    async exportToCSV(data: any[], filename: string): Promise<void> {
        if (data.length === 0) return;

        const headers = Object.keys(data[0]);
        const csv = [
            headers.join(','),
            ...data.map((row) =>
                headers.map((header) => `"${String(row[header] || '').replace(/"/g, '""')}"`).join(',')
            ),
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    }
}

export default new ReportsService();

