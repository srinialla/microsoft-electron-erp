import type { DatabaseService } from '../../../services/database/interface/DatabaseService';
import { getDatabaseService } from '../../../services/database/DatabaseFactory';
import type { Product, SalesInvoice, SalesOrder, Payment, InventoryStock } from '../../../shared/types/entities';

export interface SalesTrendData {
    date: string;
    sales: number;
    count: number;
}

export interface ProductSales {
    product_id: number;
    product_name: string;
    total_sales: number;
    quantity_sold: number;
    revenue: number;
}

class DashboardService {
    private db: DatabaseService;

    constructor() {
        this.db = getDatabaseService();
    }

    async getTodaysSales(): Promise<number> {
        const today = new Date().toISOString().split('T')[0];
        const invoices = await this.db.findAll<SalesInvoice>('sales_invoices');

        const todaysInvoices = invoices.filter(
            (inv) => inv.invoice_date.startsWith(today) && inv.status !== 'cancelled' && inv.status !== 'void'
        );

        return todaysInvoices.reduce((sum, inv) => sum + (inv.grand_total || 0), 0);
    }

    async getPendingOrdersCount(): Promise<number> {
        const orders = await this.db.findAll<SalesOrder>('sales_orders');
        return orders.filter(
            (o) => o.status === 'pending' || o.status === 'confirmed' || o.status === 'processing'
        ).length;
    }

    async getTotalCustomers(): Promise<number> {
        const customers = await this.db.findAll('customers');
        return customers.filter((c: any) => c.status === 'active').length;
    }

    async getOverduePayments(): Promise<{ count: number; amount: number }> {
        const today = new Date();
        const invoices = await this.db.findAll<SalesInvoice>('sales_invoices');

        const overdue = invoices.filter((inv) => {
            if (inv.payment_status === 'paid') return false;
            const dueDate = new Date(inv.due_date);
            return dueDate < today && inv.balance_amount > 0;
        });

        return {
            count: overdue.length,
            amount: overdue.reduce((sum, inv) => sum + inv.balance_amount, 0),
        };
    }

    async getLowStockProducts(limit: number = 10): Promise<Product[]> {
        const products = await this.db.findAll<Product>('products');
        const stock = await this.db.findAll<InventoryStock>('inventory_stock');

        const productsWithStock = products
            .map((product) => {
                const stockData = stock.find((s) => s.product_id === product.id);
                if (!stockData || !product.track_inventory) return null;

                const isLowStock =
                    product.reorder_level !== undefined &&
                    stockData.quantity_available <= product.reorder_level;

                if (isLowStock) {
                    return {
                        ...product,
                        available_stock: stockData.quantity_available,
                        reorder_level: product.reorder_level,
                    };
                }
                return null;
            })
            .filter((p): p is Product & { available_stock: number; reorder_level: number } => p !== null)
            .sort((a, b) => a.available_stock - b.available_stock)
            .slice(0, limit);

        return productsWithStock;
    }

    async getSalesTrend(days: number = 30): Promise<SalesTrendData[]> {
        const invoices = await this.db.findAll<SalesInvoice>('sales_invoices');
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const salesByDate: Record<string, { sales: number; count: number }> = {};

        invoices
            .filter((inv) => {
                const invDate = new Date(inv.invoice_date);
                return (
                    invDate >= startDate &&
                    invDate <= endDate &&
                    inv.status !== 'cancelled' &&
                    inv.status !== 'void'
                );
            })
            .forEach((inv) => {
                const dateKey = inv.invoice_date.split('T')[0];
                if (!salesByDate[dateKey]) {
                    salesByDate[dateKey] = { sales: 0, count: 0 };
                }
                salesByDate[dateKey].sales += inv.grand_total || 0;
                salesByDate[dateKey].count += 1;
            });

        // Fill in missing dates with zero sales
        const result: SalesTrendData[] = [];
        for (let i = 0; i < days; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            const dateKey = date.toISOString().split('T')[0];
            result.push({
                date: dateKey,
                sales: salesByDate[dateKey]?.sales || 0,
                count: salesByDate[dateKey]?.count || 0,
            });
        }

        return result;
    }

    async getRecentInvoices(limit: number = 10): Promise<SalesInvoice[]> {
        const invoices = await this.db.findAll<SalesInvoice>('sales_invoices');
        return invoices
            .sort((a, b) => new Date(b.invoice_date).getTime() - new Date(a.invoice_date).getTime())
            .slice(0, limit);
    }

    async getTopProducts(limit: number = 5): Promise<ProductSales[]> {
        const invoices = await this.db.findAll<SalesInvoice>('sales_invoices');
        const invoiceItems = await this.db.findAll('sales_invoice_items');
        const products = await this.db.findAll<Product>('products');

        const productSalesMap: Record<number, ProductSales> = {};

        invoiceItems.forEach((item: any) => {
            if (!productSalesMap[item.product_id]) {
                const product = products.find((p) => p.id === item.product_id);
                productSalesMap[item.product_id] = {
                    product_id: item.product_id,
                    product_name: product?.name || 'Unknown',
                    total_sales: 0,
                    quantity_sold: 0,
                    revenue: 0,
                };
            }

            const invoice = invoices.find((inv) => inv.id === item.invoice_id);
            if (invoice && invoice.status !== 'cancelled' && invoice.status !== 'void') {
                productSalesMap[item.product_id].quantity_sold += item.quantity || 0;
                productSalesMap[item.product_id].revenue += item.line_total || 0;
                productSalesMap[item.product_id].total_sales += 1;
            }
        });

        return Object.values(productSalesMap)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, limit);
    }

    async getUpcomingPayments(days: number = 7): Promise<SalesInvoice[]> {
        const today = new Date();
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + days);

        const invoices = await this.db.findAll<SalesInvoice>('sales_invoices');
        return invoices.filter((inv) => {
            if (inv.payment_status === 'paid') return false;
            const dueDate = new Date(inv.due_date);
            return dueDate >= today && dueDate <= futureDate && inv.balance_amount > 0;
        });
    }

    async getTotalRevenue(period: 'today' | 'week' | 'month' | 'year'): Promise<number> {
        const invoices = await this.db.findAll<SalesInvoice>('sales_invoices');
        const now = new Date();
        let startDate: Date;

        switch (period) {
            case 'today':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case 'week':
                startDate = new Date(now);
                startDate.setDate(startDate.getDate() - 7);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
        }

        return invoices
            .filter((inv) => {
                const invDate = new Date(inv.invoice_date);
                return (
                    invDate >= startDate &&
                    inv.status !== 'cancelled' &&
                    inv.status !== 'void'
                );
            })
            .reduce((sum, inv) => sum + (inv.grand_total || 0), 0);
    }

    async getTotalProducts(): Promise<number> {
        const products = await this.db.findAll<Product>('products');
        return products.filter((p) => p.status === 'active').length;
    }

    async getTotalVendors(): Promise<number> {
        const vendors = await this.db.findAll('vendors');
        return vendors.filter((v: any) => v.status === 'active').length;
    }
}

export default new DashboardService();
