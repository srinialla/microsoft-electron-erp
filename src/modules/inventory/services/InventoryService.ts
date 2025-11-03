import type { DatabaseService } from '../../../services/database/interface/DatabaseService';
import { getDatabaseService } from '../../../services/database/DatabaseFactory';
import type {
    StockAdjustment,
    StockAdjustmentItem,
    StockTransfer,
    StockTransferItem,
    Product,
    InventoryStock,
    Branch,
} from '../../../shared/types/entities';
import { generateDocumentNumber } from '../../../shared/utils/numberGenerator';

class InventoryService {
    private db: DatabaseService;

    constructor() {
        this.db = getDatabaseService();
    }

    // Stock Adjustments
    async createStockAdjustment(data: {
        branch_id: number;
        adjustment_date: string;
        adjustment_type: 'increase' | 'decrease';
        reason: string;
        notes?: string;
        items: Array<{
            product_id: number;
            current_quantity: number;
            adjustment_quantity: number;
            reason?: string;
        }>;
    }): Promise<number> {
        const adjustmentNumber = await generateDocumentNumber(
            'ADJ',
            'stock_adjustments',
            'adjustment_number',
            this.db
        );

        const adjustmentId = await this.db.insert('stock_adjustments', {
            adjustment_number: adjustmentNumber,
            branch_id: data.branch_id,
            adjustment_date: data.adjustment_date,
            adjustment_type: data.adjustment_type,
            reason: data.reason,
            notes: data.notes,
            status: 'draft',
        });

        // Create adjustment items
        for (const item of data.items) {
            const newQuantity =
                data.adjustment_type === 'increase'
                    ? item.current_quantity + item.adjustment_quantity
                    : item.current_quantity - item.adjustment_quantity;

            await this.db.insert('stock_adjustment_items', {
                adjustment_id: adjustmentId,
                product_id: item.product_id,
                current_quantity: item.current_quantity,
                adjustment_quantity: item.adjustment_quantity,
                new_quantity: newQuantity,
                reason: item.reason,
            });

            // Update inventory stock
            const stock = await this.db.findAll('inventory_stock');
            const stockData = stock.find(
                (s: any) => s.product_id === item.product_id && s.branch_id === data.branch_id
            );

            if (stockData) {
                await this.db.update('inventory_stock', stockData.id, {
                    quantity_on_hand: newQuantity,
                    quantity_available: newQuantity - (stockData.quantity_reserved || 0),
                });
            } else {
                await this.db.insert('inventory_stock', {
                    product_id: item.product_id,
                    branch_id: data.branch_id,
                    quantity_on_hand: newQuantity,
                    quantity_reserved: 0,
                    quantity_available: newQuantity,
                });
            }

            // Create stock movement
            await this.db.insert('stock_movements', {
                product_id: item.product_id,
                branch_id: data.branch_id,
                movement_type: 'adjustment',
                quantity:
                    data.adjustment_type === 'increase'
                        ? item.adjustment_quantity
                        : -item.adjustment_quantity,
                reference_type: 'stock_adjustment',
                reference_id: adjustmentId,
                reference_number: adjustmentNumber,
                notes: item.reason || data.reason,
            });
        }

        return adjustmentId;
    }

    async getStockAdjustments(options?: {
        branch_id?: number;
        status?: string;
    }): Promise<StockAdjustment[]> {
        let adjustments = await this.db.findAll<StockAdjustment>('stock_adjustments');

        if (options?.branch_id) {
            adjustments = adjustments.filter((a) => a.branch_id === options.branch_id);
        }
        if (options?.status) {
            adjustments = adjustments.filter((a) => a.status === options.status);
        }

        return adjustments.sort(
            (a, b) => new Date(b.adjustment_date).getTime() - new Date(a.adjustment_date).getTime()
        );
    }

    async getStockAdjustmentById(id: number): Promise<StockAdjustment | null> {
        return await this.db.findById<StockAdjustment>('stock_adjustments', id);
    }

    async getStockAdjustmentItems(adjustmentId: number): Promise<StockAdjustmentItem[]> {
        const items = await this.db.findAll<any>('stock_adjustment_items');
        return items.filter((item: any) => item.adjustment_id === adjustmentId);
    }

    // Stock Transfers
    async createStockTransfer(data: {
        from_branch_id: number;
        to_branch_id: number;
        transfer_date: string;
        notes?: string;
        items: Array<{
            product_id: number;
            quantity: number;
        }>;
    }): Promise<number> {
        const transferNumber = await generateDocumentNumber(
            'TRF',
            'stock_transfers',
            'transfer_number',
            this.db
        );

        const transferId = await this.db.insert('stock_transfers', {
            transfer_number: transferNumber,
            from_branch_id: data.from_branch_id,
            to_branch_id: data.to_branch_id,
            transfer_date: data.transfer_date,
            notes: data.notes,
            status: 'pending',
        });

        // Create transfer items
        for (const item of data.items) {
            await this.db.insert('stock_transfer_items', {
                transfer_id: transferId,
                product_id: item.product_id,
                quantity: item.quantity,
            });

            // Update source branch inventory (decrease)
            const fromStock = await this.db.findAll('inventory_stock');
            const fromStockData = fromStock.find(
                (s: any) => s.product_id === item.product_id && s.branch_id === data.from_branch_id
            );

            if (fromStockData) {
                await this.db.update('inventory_stock', fromStockData.id, {
                    quantity_on_hand: fromStockData.quantity_on_hand - item.quantity,
                    quantity_available:
                        fromStockData.quantity_available - item.quantity >= 0
                            ? fromStockData.quantity_available - item.quantity
                            : 0,
                });
            }

            // Create stock movement for source branch
            await this.db.insert('stock_movements', {
                product_id: item.product_id,
                branch_id: data.from_branch_id,
                movement_type: 'transfer_out',
                quantity: item.quantity,
                reference_type: 'stock_transfer',
                reference_id: transferId,
                reference_number: transferNumber,
            });
        }

        return transferId;
    }

    async receiveStockTransfer(transferId: number): Promise<boolean> {
        const transfer = await this.getStockTransferById(transferId);
        if (!transfer || transfer.status !== 'pending') {
            throw new Error('Invalid transfer or already processed');
        }

        const items = await this.getStockTransferItems(transferId);

        // Update destination branch inventory (increase)
        for (const item of items) {
            const toStock = await this.db.findAll('inventory_stock');
            const toStockData = toStock.find(
                (s: any) => s.product_id === item.product_id && s.branch_id === transfer.to_branch_id
            );

            if (toStockData) {
                await this.db.update('inventory_stock', toStockData.id, {
                    quantity_on_hand: toStockData.quantity_on_hand + item.quantity,
                    quantity_available: toStockData.quantity_available + item.quantity,
                });
            } else {
                // Create new stock entry for destination branch
                await this.db.insert('inventory_stock', {
                    product_id: item.product_id,
                    branch_id: transfer.to_branch_id,
                    quantity_on_hand: item.quantity,
                    quantity_reserved: 0,
                    quantity_available: item.quantity,
                });
            }

            // Create stock movement for destination branch
            await this.db.insert('stock_movements', {
                product_id: item.product_id,
                branch_id: transfer.to_branch_id,
                movement_type: 'transfer_in',
                quantity: item.quantity,
                reference_type: 'stock_transfer',
                reference_id: transferId,
                reference_number: transfer.transfer_number,
            });
        }

        // Update transfer status
        await this.db.update('stock_transfers', transferId, {
            status: 'received',
        });

        return true;
    }

    async getStockTransfers(options?: {
        from_branch_id?: number;
        to_branch_id?: number;
        status?: string;
    }): Promise<StockTransfer[]> {
        let transfers = await this.db.findAll<StockTransfer>('stock_transfers');

        if (options?.from_branch_id) {
            transfers = transfers.filter((t) => t.from_branch_id === options.from_branch_id);
        }
        if (options?.to_branch_id) {
            transfers = transfers.filter((t) => t.to_branch_id === options.to_branch_id);
        }
        if (options?.status) {
            transfers = transfers.filter((t) => t.status === options.status);
        }

        return transfers.sort(
            (a, b) => new Date(b.transfer_date).getTime() - new Date(a.transfer_date).getTime()
        );
    }

    async getStockTransferById(id: number): Promise<StockTransfer | null> {
        return await this.db.findById<StockTransfer>('stock_transfers', id);
    }

    async getStockTransferItems(transferId: number): Promise<StockTransferItem[]> {
        const items = await this.db.findAll<any>('stock_transfer_items');
        return items.filter((item: any) => item.transfer_id === transferId);
    }

    // Bulk price update
    async bulkUpdatePrices(
        updates: Array<{
            product_id: number;
            cost_price?: number;
            selling_price?: number;
            mrp?: number;
            wholesale_price?: number;
        }>
    ): Promise<number> {
        let updated = 0;
        for (const update of updates) {
            const { product_id, ...prices } = update;
            await this.db.update('products', product_id, prices);
            updated++;
        }
        return updated;
    }

    // Get branches
    async getBranches(): Promise<Branch[]> {
        return await this.db.findAll<Branch>('branches');
    }

    // Get inventory stock
    async getInventoryStock(
        options?: {
            branch_id?: number;
            product_id?: number;
        }
    ): Promise<InventoryStock[]> {
        let stock = await this.db.findAll<InventoryStock>('inventory_stock');

        if (options?.branch_id) {
            stock = stock.filter((s) => s.branch_id === options.branch_id);
        }
        if (options?.product_id) {
            stock = stock.filter((s) => s.product_id === options.product_id);
        }

        return stock;
    }

    // Get products with stock levels
    async getProductsWithStock(branchId: number = 1): Promise<
        Array<
            Product & {
                stock: InventoryStock | null;
            }
        >
    > {
        const products = await this.db.findAll<Product>('products');
        const stock = await this.getInventoryStock({ branch_id: branchId });

        return products.map((product) => ({
            ...product,
            stock: stock.find((s) => s.product_id === product.id) || null,
        }));
    }
}

export default new InventoryService();

