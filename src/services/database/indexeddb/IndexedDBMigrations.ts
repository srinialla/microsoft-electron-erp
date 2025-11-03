// IndexedDB migration helper - creates object stores from schema

export interface IndexedDBStore {
    name: string;
    keyPath: string;
    indexes?: { name: string; keyPath: string; unique?: boolean }[];
}

export function createIndexedDBStores(db: IDBDatabase): void {
    const stores: IndexedDBStore[] = [
        // Core tables
        { name: 'companies', keyPath: 'id' },
        { name: 'branches', keyPath: 'id', indexes: [{ name: 'company_id', keyPath: 'company_id' }] },
        { name: 'users', keyPath: 'id', indexes: [{ name: 'username', keyPath: 'username', unique: true }, { name: 'email', keyPath: 'email', unique: true }] },
        { name: 'tax_settings', keyPath: 'id', indexes: [{ name: 'company_id', keyPath: 'company_id' }] },

        // Customer tables
        { name: 'customer_categories', keyPath: 'id' },
        { name: 'customers', keyPath: 'id', indexes: [{ name: 'customer_code', keyPath: 'customer_code', unique: true }] },

        // Vendor tables
        { name: 'vendors', keyPath: 'id', indexes: [{ name: 'vendor_code', keyPath: 'vendor_code', unique: true }] },

        // Product tables
        { name: 'product_categories', keyPath: 'id', indexes: [{ name: 'parent_id', keyPath: 'parent_id' }] },
        { name: 'product_brands', keyPath: 'id' },
        { name: 'units_of_measure', keyPath: 'id', indexes: [{ name: 'unit_name', keyPath: 'unit_name', unique: true }] },
        { name: 'products', keyPath: 'id', indexes: [{ name: 'product_code', keyPath: 'product_code', unique: true }] },
        { name: 'inventory_stock', keyPath: 'id', indexes: [{ name: 'product_id', keyPath: 'product_id' }, { name: 'branch_id', keyPath: 'branch_id' }] },
        { name: 'stock_movements', keyPath: 'id', indexes: [{ name: 'product_id', keyPath: 'product_id' }, { name: 'branch_id', keyPath: 'branch_id' }] },
        { name: 'price_lists', keyPath: 'id' },
        { name: 'price_list_items', keyPath: 'id', indexes: [{ name: 'price_list_id', keyPath: 'price_list_id' }, { name: 'product_id', keyPath: 'product_id' }] },

        // Sales tables
        { name: 'sales_quotations', keyPath: 'id', indexes: [{ name: 'quotation_number', keyPath: 'quotation_number', unique: true }, { name: 'customer_id', keyPath: 'customer_id' }] },
        { name: 'sales_quotation_items', keyPath: 'id', indexes: [{ name: 'quotation_id', keyPath: 'quotation_id' }] },
        { name: 'sales_orders', keyPath: 'id', indexes: [{ name: 'order_number', keyPath: 'order_number', unique: true }, { name: 'customer_id', keyPath: 'customer_id' }] },
        { name: 'sales_order_items', keyPath: 'id', indexes: [{ name: 'order_id', keyPath: 'order_id' }] },
        { name: 'sales_invoices', keyPath: 'id', indexes: [{ name: 'invoice_number', keyPath: 'invoice_number', unique: true }, { name: 'customer_id', keyPath: 'customer_id' }] },
        { name: 'sales_invoice_items', keyPath: 'id', indexes: [{ name: 'invoice_id', keyPath: 'invoice_id' }] },
        { name: 'sales_returns', keyPath: 'id', indexes: [{ name: 'return_number', keyPath: 'return_number', unique: true }, { name: 'invoice_id', keyPath: 'invoice_id' }] },
        { name: 'sales_return_items', keyPath: 'id', indexes: [{ name: 'return_id', keyPath: 'return_id' }] },

        // Purchase tables
        { name: 'purchase_orders', keyPath: 'id', indexes: [{ name: 'po_number', keyPath: 'po_number', unique: true }, { name: 'vendor_id', keyPath: 'vendor_id' }] },
        { name: 'purchase_order_items', keyPath: 'id', indexes: [{ name: 'po_id', keyPath: 'po_id' }] },
        { name: 'goods_received_notes', keyPath: 'id', indexes: [{ name: 'grn_number', keyPath: 'grn_number', unique: true }, { name: 'po_id', keyPath: 'po_id' }] },
        { name: 'grn_items', keyPath: 'id', indexes: [{ name: 'grn_id', keyPath: 'grn_id' }] },
        { name: 'purchase_returns', keyPath: 'id', indexes: [{ name: 'return_number', keyPath: 'return_number', unique: true }, { name: 'po_id', keyPath: 'po_id' }] },
        { name: 'purchase_return_items', keyPath: 'id', indexes: [{ name: 'return_id', keyPath: 'return_id' }] },

        // Accounting tables
        { name: 'payments', keyPath: 'id', indexes: [{ name: 'payment_number', keyPath: 'payment_number', unique: true }] },
        { name: 'payment_allocations', keyPath: 'id', indexes: [{ name: 'payment_id', keyPath: 'payment_id' }] },
        { name: 'chart_of_accounts', keyPath: 'id', indexes: [{ name: 'account_code', keyPath: 'account_code', unique: true }] },
        { name: 'journal_entries', keyPath: 'id', indexes: [{ name: 'entry_number', keyPath: 'entry_number', unique: true }] },
        { name: 'journal_entry_lines', keyPath: 'id', indexes: [{ name: 'entry_id', keyPath: 'entry_id' }] },
        { name: 'bank_accounts', keyPath: 'id' },
        { name: 'bank_transactions', keyPath: 'id', indexes: [{ name: 'bank_account_id', keyPath: 'bank_account_id' }] },

        // Other tables
        { name: 'delivery_notes', keyPath: 'id', indexes: [{ name: 'delivery_number', keyPath: 'delivery_number', unique: true }, { name: 'order_id', keyPath: 'order_id' }] },
        { name: 'delivery_note_items', keyPath: 'id', indexes: [{ name: 'delivery_note_id', keyPath: 'delivery_note_id' }] },
        { name: 'stock_adjustments', keyPath: 'id', indexes: [{ name: 'adjustment_number', keyPath: 'adjustment_number', unique: true }, { name: 'branch_id', keyPath: 'branch_id' }] },
        { name: 'stock_adjustment_items', keyPath: 'id', indexes: [{ name: 'adjustment_id', keyPath: 'adjustment_id' }] },

        // Migration tracking (id is a string like '001', not auto-increment)
        { name: '_migrations', keyPath: 'id' },
    ];

    for (const store of stores) {
        if (!db.objectStoreNames.contains(store.name)) {
            // Don't auto-increment for _migrations (id is string), but do for others with id keyPath
            const shouldAutoIncrement = store.keyPath === 'id' && store.name !== '_migrations';
            const objectStore = db.createObjectStore(store.name, { keyPath: store.keyPath, autoIncrement: shouldAutoIncrement });
            if (store.indexes) {
                for (const index of store.indexes) {
                    objectStore.createIndex(index.name, index.keyPath, { unique: index.unique || false });
                }
            }
        }
    }
}

