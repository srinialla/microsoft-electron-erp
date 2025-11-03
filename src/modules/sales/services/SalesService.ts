import type { DatabaseService } from '../../../services/database/interface/DatabaseService';
import { getDatabaseService } from '../../../services/database/DatabaseFactory';
import type {
    SalesInvoice,
    SalesInvoiceItem,
    SalesOrder,
    SalesOrderItem,
    SalesQuotation,
    SalesQuotationItem,
} from '../../../shared/types/entities';
import { generateDocumentNumber, generateInvoiceNumber } from '../../../shared/utils/numberGenerator';
import { calculateLineTotal, calculateDocumentTotals } from '../../../shared/utils/calculations';

class SalesService {
    private db: DatabaseService;

    constructor() {
        this.db = getDatabaseService();
    }

    // Invoices
    async createInvoice(data: {
        customer_id: number;
        invoice_date: string;
        due_date: string;
        branch_id?: number;
        items: Array<{
            product_id: number;
            description?: string;
            quantity: number;
            unit_price: number;
            discount_percent: number;
            tax_rate: number;
        }>;
        discount_type?: 'fixed' | 'percentage';
        discount_value?: number;
        shipping_charges?: number;
        notes?: string;
        record_payment?: {
            amount: number;
            payment_method: string;
            payment_date: string;
        };
    }): Promise<number> {
        const invoiceNumber = await generateInvoiceNumber('INV', this.db);

        // Calculate totals
        const lineItems = data.items.map((item) =>
            calculateLineTotal(item.quantity, item.unit_price, item.discount_percent, item.tax_rate)
        );

        const totals = calculateDocumentTotals(
            data.items.map((item) => ({
                quantity: item.quantity,
                unitPrice: item.unit_price,
                discountPercent: item.discount_percent,
                taxRate: item.tax_rate,
            })),
            data.discount_type || 'percentage',
            data.discount_value || 0,
            data.shipping_charges || 0
        );

        const invoiceData: Omit<SalesInvoice, 'id' | 'created_at' | 'updated_at'> = {
            invoice_number: invoiceNumber,
            customer_id: data.customer_id,
            invoice_date: data.invoice_date,
            due_date: data.due_date,
            branch_id: data.branch_id,
            subtotal: totals.subtotal,
            discount_amount: totals.totalDiscount,
            tax_amount: totals.totalTax,
            shipping_charges: data.shipping_charges || 0,
            grand_total: totals.grandTotal,
            paid_amount: data.record_payment?.amount || 0,
            balance_amount: totals.grandTotal - (data.record_payment?.amount || 0),
            notes: data.notes,
            status: 'draft',
            payment_status: data.record_payment ? 'paid' : 'unpaid',
        };

        const invoiceId = await this.db.insert('sales_invoices', invoiceData);

        // Insert line items
        const itemPromises = data.items.map((item, index) => {
            const lineTotal = calculateLineTotal(
                item.quantity,
                item.unit_price,
                item.discount_percent,
                item.tax_rate
            );
            return this.db.insert('sales_invoice_items', {
                invoice_id: invoiceId,
                product_id: item.product_id,
                description: item.description,
                quantity: item.quantity,
                unit_price: item.unit_price,
                discount_percent: item.discount_percent,
                tax_rate: item.tax_rate,
                line_total: lineTotal.lineTotal,
                sequence: index + 1,
            });
        });

        await Promise.all(itemPromises);

        // Update inventory if payment recorded
        if (data.record_payment) {
            // Insert payment
            const paymentNumber = await generateDocumentNumber('PAY', 'payments', 'payment_number', this.db);
            await this.db.insert('payments', {
                payment_number: paymentNumber,
                customer_id: data.customer_id,
                payment_date: data.record_payment.payment_date,
                amount: data.record_payment.amount,
                payment_method: data.record_payment.payment_method as any,
                status: 'completed',
            });

            // Update invoice status
            await this.db.update('sales_invoices', invoiceId, {
                payment_status: 'paid',
                status: 'paid',
            });
        }

        // Update inventory stock
        for (const item of data.items) {
            const stock = await this.db.findAll('inventory_stock');
            const stockData = stock.find((s: any) => s.product_id === item.product_id);
            if (stockData) {
                await this.db.update('inventory_stock', stockData.id, {
                    quantity_on_hand: stockData.quantity_on_hand - item.quantity,
                    quantity_available: stockData.quantity_available - item.quantity,
                });

                // Create stock movement
                await this.db.insert('stock_movements', {
                    product_id: item.product_id,
                    branch_id: data.branch_id || 1,
                    movement_type: 'out',
                    quantity: item.quantity,
                    reference_type: 'sales_invoice',
                    reference_id: invoiceId,
                    reference_number: invoiceNumber,
                });
            }
        }

        return invoiceId;
    }

    async getInvoiceById(id: number): Promise<SalesInvoice | null> {
        return await this.db.findById<SalesInvoice>('sales_invoices', id);
    }

    async getInvoiceItems(invoiceId: number): Promise<SalesInvoiceItem[]> {
        const all = await this.db.findAll<SalesInvoiceItem>('sales_invoice_items');
        return all.filter((item) => item.invoice_id === invoiceId);
    }

    async getInvoices(options?: {
        customer_id?: number;
        status?: string;
        date_from?: string;
        date_to?: string;
    }): Promise<SalesInvoice[]> {
        let invoices = await this.db.findAll<SalesInvoice>('sales_invoices');

        if (options?.customer_id) {
            invoices = invoices.filter((inv) => inv.customer_id === options.customer_id);
        }

        if (options?.status) {
            invoices = invoices.filter((inv) => inv.status === options.status);
        }

        if (options?.date_from) {
            invoices = invoices.filter((inv) => inv.invoice_date >= options.date_from!);
        }

        if (options?.date_to) {
            invoices = invoices.filter((inv) => inv.invoice_date <= options.date_to!);
        }

        return invoices.sort((a, b) => new Date(b.invoice_date).getTime() - new Date(a.invoice_date).getTime());
    }

    // Orders
    async createOrder(data: {
        customer_id: number;
        order_date: string;
        expected_delivery_date?: string;
        branch_id?: number;
        items: Array<{
            product_id: number;
            description?: string;
            quantity: number;
            unit_price: number;
            discount_percent: number;
            tax_rate: number;
        }>;
        shipping_charges?: number;
        reserve_inventory?: boolean;
        notes?: string;
    }): Promise<number> {
        const orderNumber = await generateDocumentNumber('SO', 'sales_orders', 'order_number', this.db);

        const totals = calculateDocumentTotals(
            data.items.map((item) => ({
                quantity: item.quantity,
                unitPrice: item.unit_price,
                discountPercent: item.discount_percent,
                taxRate: item.tax_rate,
            })),
            'percentage',
            0,
            data.shipping_charges || 0
        );

        const orderData: Omit<SalesOrder, 'id' | 'created_at' | 'updated_at'> = {
            order_number: orderNumber,
            customer_id: data.customer_id,
            order_date: data.order_date,
            expected_delivery_date: data.expected_delivery_date,
            branch_id: data.branch_id,
            shipping_charges: data.shipping_charges || 0,
            reserve_inventory: data.reserve_inventory || false,
            subtotal: totals.subtotal,
            discount_amount: 0,
            tax_amount: totals.totalTax,
            grand_total: totals.grandTotal,
            notes: data.notes,
            status: 'pending',
            payment_status: 'unpaid',
            fulfillment_status: 'pending',
        };

        const orderId = await this.db.insert('sales_orders', orderData);

        // Insert line items
        for (const [index, item] of data.items.entries()) {
            const lineTotal = calculateLineTotal(
                item.quantity,
                item.unit_price,
                item.discount_percent,
                item.tax_rate
            );
            await this.db.insert('sales_order_items', {
                order_id: orderId,
                product_id: item.product_id,
                description: item.description,
                quantity: item.quantity,
                quantity_shipped: 0,
                unit_price: item.unit_price,
                discount_percent: item.discount_percent,
                tax_rate: item.tax_rate,
                line_total: lineTotal.lineTotal,
                sequence: index + 1,
            });
        }

        // Reserve inventory if requested
        if (data.reserve_inventory) {
            for (const item of data.items) {
                const stock = await this.db.findAll('inventory_stock');
                const stockData = stock.find((s: any) => s.product_id === item.product_id);
                if (stockData) {
                    await this.db.update('inventory_stock', stockData.id, {
                        quantity_reserved: stockData.quantity_reserved + item.quantity,
                        quantity_available: stockData.quantity_available - item.quantity,
                    });
                }
            }
        }

        return orderId;
    }

    async getOrderById(id: number): Promise<SalesOrder | null> {
        return await this.db.findById<SalesOrder>('sales_orders', id);
    }

    async getOrders(options?: {
        customer_id?: number;
        status?: string;
    }): Promise<SalesOrder[]> {
        let orders = await this.db.findAll<SalesOrder>('sales_orders');

        if (options?.customer_id) {
            orders = orders.filter((o) => o.customer_id === options.customer_id);
        }

        if (options?.status) {
            orders = orders.filter((o) => o.status === options.status);
        }

        return orders.sort((a, b) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime());
    }
}

export default new SalesService();
