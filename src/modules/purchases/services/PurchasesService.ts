import type { DatabaseService } from '../../../services/database/interface/DatabaseService';
import { getDatabaseService } from '../../../services/database/DatabaseFactory';
import type {
    PurchaseOrder,
    PurchaseOrderItem,
    GoodsReceivedNote,
    GRNItem,
} from '../../../shared/types/entities';
import { generateDocumentNumber } from '../../../shared/utils/numberGenerator';
import { calculateLineTotal, calculateDocumentTotals } from '../../../shared/utils/calculations';

class PurchasesService {
    private db: DatabaseService;

    constructor() {
        this.db = getDatabaseService();
    }

    async createPurchaseOrder(data: {
        vendor_id: number;
        order_date: string;
        expected_delivery_date?: string;
        branch_id?: number;
        items: Array<{
            product_id: number;
            description?: string;
            quantity: number;
            unit_cost: number;
            discount_percent: number;
            tax_rate: number;
        }>;
        shipping_charges?: number;
        notes?: string;
    }): Promise<number> {
        const poNumber = await generateDocumentNumber('PO', 'purchase_orders', 'po_number', this.db);

        const totals = calculateDocumentTotals(
            data.items.map((item) => ({
                quantity: item.quantity,
                unitPrice: item.unit_cost,
                discountPercent: item.discount_percent,
                taxRate: item.tax_rate,
            })),
            'percentage',
            0,
            data.shipping_charges || 0
        );

        const poData: Omit<PurchaseOrder, 'id' | 'created_at' | 'updated_at'> = {
            po_number: poNumber,
            vendor_id: data.vendor_id,
            order_date: data.order_date,
            expected_delivery_date: data.expected_delivery_date,
            branch_id: data.branch_id,
            subtotal: totals.subtotal,
            discount_amount: 0,
            tax_amount: totals.totalTax,
            shipping_charges: data.shipping_charges || 0,
            grand_total: totals.grandTotal,
            notes: data.notes,
            status: 'draft',
        };

        const poId = await this.db.insert('purchase_orders', poData);

        // Insert line items
        for (const [index, item] of data.items.entries()) {
            const lineTotal = calculateLineTotal(
                item.quantity,
                item.unit_cost,
                item.discount_percent,
                item.tax_rate
            );
            await this.db.insert('purchase_order_items', {
                po_id: poId,
                product_id: item.product_id,
                description: item.description,
                quantity: item.quantity,
                quantity_received: 0,
                unit_cost: item.unit_cost,
                discount_percent: item.discount_percent,
                tax_rate: item.tax_rate,
                line_total: lineTotal.lineTotal,
                sequence: index + 1,
            });
        }

        return poId;
    }

    async getPurchaseOrderById(id: number): Promise<PurchaseOrder | null> {
        return await this.db.findById<PurchaseOrder>('purchase_orders', id);
    }

    async getPurchaseOrders(options?: {
        vendor_id?: number;
        status?: string;
    }): Promise<PurchaseOrder[]> {
        let orders = await this.db.findAll<PurchaseOrder>('purchase_orders');

        if (options?.vendor_id) {
            orders = orders.filter((o) => o.vendor_id === options.vendor_id);
        }

        if (options?.status) {
            orders = orders.filter((o) => o.status === options.status);
        }

        return orders.sort((a, b) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime());
    }

    async createGRN(data: {
        po_id: number;
        vendor_id: number;
        received_date: string;
        branch_id?: number;
        vendor_invoice_number?: string;
        vendor_invoice_date?: string;
        items: Array<{
            po_item_id: number;
            product_id: number;
            ordered_quantity: number;
            received_quantity: number;
            accepted_quantity: number;
            rejected_quantity: number;
            rejection_reason?: string;
            unit_cost: number;
        }>;
        notes?: string;
    }): Promise<number> {
        const grnNumber = await generateDocumentNumber('GRN', 'goods_received_notes', 'grn_number', this.db);

        const grnData: Omit<GoodsReceivedNote, 'id' | 'created_at' | 'updated_at'> = {
            grn_number: grnNumber,
            po_id: data.po_id,
            vendor_id: data.vendor_id,
            received_date: data.received_date,
            branch_id: data.branch_id,
            vendor_invoice_number: data.vendor_invoice_number,
            vendor_invoice_date: data.vendor_invoice_date,
            notes: data.notes,
            status: 'completed',
        };

        const grnId = await this.db.insert('goods_received_notes', grnData);

        // Insert GRN items
        for (const item of data.items) {
            await this.db.insert('grn_items', {
                grn_id: grnId,
                po_item_id: item.po_item_id,
                product_id: item.product_id,
                ordered_quantity: item.ordered_quantity,
                received_quantity: item.received_quantity,
                accepted_quantity: item.accepted_quantity,
                rejected_quantity: item.rejected_quantity,
                rejection_reason: item.rejection_reason,
                unit_cost: item.unit_cost,
            });

            // Update purchase order item received quantity
            const poItems = await this.db.findAll<PurchaseOrderItem>('purchase_order_items');
            const poItem = poItems.find((i) => i.id === item.po_item_id);
            if (poItem) {
                await this.db.update('purchase_order_items', poItem.id, {
                    quantity_received: poItem.quantity_received + item.accepted_quantity,
                });
            }

            // Update inventory stock
            const stock = await this.db.findAll('inventory_stock');
            const stockData = stock.find((s: any) => s.product_id === item.product_id && (s.branch_id === data.branch_id || s.branch_id === 1));

            if (stockData) {
                await this.db.update('inventory_stock', stockData.id, {
                    quantity_on_hand: stockData.quantity_on_hand + item.accepted_quantity,
                    quantity_available: stockData.quantity_available + item.accepted_quantity,
                    average_cost: ((stockData.average_cost * stockData.quantity_on_hand) + (item.unit_cost * item.accepted_quantity)) / (stockData.quantity_on_hand + item.accepted_quantity),
                    last_cost: item.unit_cost,
                });
            } else if (item.product_id) {
                // Create new stock entry
                await this.db.insert('inventory_stock', {
                    product_id: item.product_id,
                    branch_id: data.branch_id || 1,
                    quantity_on_hand: item.accepted_quantity,
                    quantity_reserved: 0,
                    quantity_available: item.accepted_quantity,
                    average_cost: item.unit_cost,
                    last_cost: item.unit_cost,
                });
            }

            // Create stock movement
            await this.db.insert('stock_movements', {
                product_id: item.product_id,
                branch_id: data.branch_id || 1,
                movement_type: 'in',
                quantity: item.accepted_quantity,
                reference_type: 'goods_received_note',
                reference_id: grnId,
                reference_number: grnNumber,
            });
        }

        // Update PO status
        const po = await this.getPurchaseOrderById(data.po_id);
        if (po) {
            const poItems = await this.db.findAll<PurchaseOrderItem>('purchase_order_items');
            const poItemsForPo = poItems.filter((i) => i.po_id === data.po_id);
            const allReceived = poItemsForPo.every((i) => i.quantity_received >= i.quantity);

            await this.db.update('purchase_orders', data.po_id, {
                status: allReceived ? 'fully_received' : 'partially_received',
            });
        }

        return grnId;
    }
}

export default new PurchasesService();
