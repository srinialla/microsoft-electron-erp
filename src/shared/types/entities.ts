/**
 * Core entity types for ERP system
 */

// Base entity interface
export interface BaseEntity {
    id: number;
    created_at: string;
    updated_at?: string;
}

// Company & Branches
export interface Company extends BaseEntity {
    name: string;
    legal_name?: string;
    tax_number?: string;
    gst_number?: string;
    pan_number?: string;
    email?: string;
    phone?: string;
    website?: string;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;
    logo_url?: string;
    currency?: string;
    fiscal_year_start?: string;
}

export interface Branch extends BaseEntity {
    company_id: number;
    branch_code: string;
    name: string;
    contact_person?: string;
    email?: string;
    phone?: string;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;
    is_main_branch: boolean;
    allow_negative_stock: boolean;
    status: 'active' | 'inactive';
}

// Customers
export interface CustomerCategory extends BaseEntity {
    name: string;
    description?: string;
    default_discount_percent?: number;
    credit_limit?: number;
    payment_terms?: number;
}

export interface Customer extends BaseEntity {
    customer_code: string;
    customer_type: 'individual' | 'company';
    title?: string;
    first_name?: string;
    last_name?: string;
    company_name?: string;
    display_name: string;
    email?: string;
    phone?: string;
    mobile?: string;
    website?: string;
    contact_person?: string;
    contact_person_email?: string;
    contact_person_phone?: string;
    billing_address_line1?: string;
    billing_address_line2?: string;
    billing_city?: string;
    billing_state?: string;
    billing_country?: string;
    billing_postal_code?: string;
    shipping_address_line1?: string;
    shipping_address_line2?: string;
    shipping_city?: string;
    shipping_state?: string;
    shipping_country?: string;
    shipping_postal_code?: string;
    tax_number?: string;
    pan_number?: string;
    gst_number?: string;
    customer_category_id?: number;
    price_list_id?: number;
    payment_terms?: number;
    credit_limit?: number;
    discount_percent?: number;
    opening_balance?: number;
    current_balance?: number;
    notes?: string;
    tags?: string;
    status: 'active' | 'inactive';
}

export interface CustomerContact extends BaseEntity {
    customer_id: number;
    name: string;
    email?: string;
    phone?: string;
    position?: string;
    is_primary: boolean;
}

export interface CustomerShippingAddress extends BaseEntity {
    customer_id: number;
    address_name: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    state?: string;
    country?: string;
    postal_code?: string;
    is_default: boolean;
}

// Vendors (similar to customers)
export interface Vendor extends BaseEntity {
    vendor_code: string;
    vendor_type: 'individual' | 'company';
    name: string;
    display_name: string;
    email?: string;
    phone?: string;
    website?: string;
    contact_person?: string;
    billing_address_line1?: string;
    billing_address_line2?: string;
    billing_city?: string;
    billing_state?: string;
    billing_country?: string;
    billing_postal_code?: string;
    tax_number?: string;
    gst_number?: string;
    payment_terms?: number;
    bank_name?: string;
    bank_account_number?: string;
    bank_ifsc?: string;
    preferred_payment_method?: string;
    rating?: number;
    notes?: string;
    status: 'active' | 'inactive';
}

// Products
export interface ProductCategory extends BaseEntity {
    name: string;
    description?: string;
    parent_id?: number;
    level?: number;
}

export interface ProductBrand extends BaseEntity {
    name: string;
    description?: string;
}

export interface UnitOfMeasure extends BaseEntity {
    unit_name: string;
    unit_symbol: string;
    unit_type: 'weight' | 'volume' | 'length' | 'count';
    conversion_factor?: number;
}

export interface Product extends BaseEntity {
    product_code: string;
    barcode?: string;
    sku?: string;
    name: string;
    description?: string;
    category_id?: number;
    brand_id?: number;
    product_type: 'physical' | 'service' | 'digital';
    cost_price: number;
    selling_price: number;
    mrp?: number;
    wholesale_price?: number;
    track_inventory: boolean;
    unit_of_measure_id?: number;
    reorder_level?: number;
    reorder_quantity?: number;
    tax_preference: 'taxable' | 'non_taxable';
    tax_rate?: number;
    hsn_sac_code?: string;
    weight?: number;
    weight_unit?: string;
    length?: number;
    width?: number;
    height?: number;
    dimension_unit?: string;
    primary_image_url?: string;
    additional_images?: string;
    preferred_vendor_id?: number;
    tags?: string;
    notes?: string;
    status: 'active' | 'inactive';
}

export interface InventoryStock extends BaseEntity {
    product_id: number;
    branch_id: number;
    quantity_on_hand: number;
    quantity_reserved: number;
    quantity_available: number;
    average_cost: number;
    last_cost?: number;
    reorder_level?: number;
}

export interface StockMovement extends BaseEntity {
    product_id: number;
    branch_id: number;
    movement_type: 'in' | 'out' | 'transfer_in' | 'transfer_out' | 'adjustment';
    quantity: number;
    reference_type?: string;
    reference_id?: number;
    reference_number?: string;
    notes?: string;
}

// Sales Documents
export interface SalesQuotation extends BaseEntity {
    quotation_number: string;
    customer_id: number;
    quotation_date: string;
    valid_until_date?: string;
    branch_id?: number;
    subtotal: number;
    discount_amount: number;
    discount_type: 'fixed' | 'percentage';
    discount_value: number;
    tax_amount: number;
    shipping_charges: number;
    grand_total: number;
    notes?: string;
    terms_conditions?: string;
    internal_notes?: string;
    status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
}

export interface SalesQuotationItem extends BaseEntity {
    quotation_id: number;
    product_id: number;
    description?: string;
    quantity: number;
    unit_price: number;
    discount_percent: number;
    tax_rate: number;
    line_total: number;
    sequence: number;
}

export interface SalesOrder extends BaseEntity {
    order_number: string;
    customer_id: number;
    order_date: string;
    expected_delivery_date?: string;
    branch_id?: number;
    shipping_address?: string;
    shipping_charges: number;
    payment_terms?: number;
    reserve_inventory: boolean;
    subtotal: number;
    discount_amount: number;
    tax_amount: number;
    grand_total: number;
    notes?: string;
    status: 'draft' | 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    payment_status: 'unpaid' | 'partial' | 'paid';
    fulfillment_status: 'pending' | 'partial' | 'fulfilled';
}

export interface SalesOrderItem extends BaseEntity {
    order_id: number;
    product_id: number;
    description?: string;
    quantity: number;
    quantity_shipped: number;
    unit_price: number;
    discount_percent: number;
    tax_rate: number;
    line_total: number;
    sequence: number;
}

export interface SalesInvoice extends BaseEntity {
    invoice_number: string;
    customer_id: number;
    invoice_date: string;
    due_date: string;
    sales_order_id?: number;
    branch_id?: number;
    subtotal: number;
    discount_amount: number;
    tax_amount: number;
    shipping_charges: number;
    grand_total: number;
    paid_amount: number;
    balance_amount: number;
    notes?: string;
    terms_conditions?: string;
    status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled' | 'void';
    payment_status: 'unpaid' | 'partial' | 'paid';
}

export interface SalesInvoiceItem extends BaseEntity {
    invoice_id: number;
    product_id: number;
    description?: string;
    quantity: number;
    unit_price: number;
    discount_percent: number;
    tax_rate: number;
    line_total: number;
    sequence: number;
}

export interface SalesReturn extends BaseEntity {
    return_number: string;
    invoice_id: number;
    customer_id: number;
    return_date: string;
    reason: string;
    subtotal: number;
    tax_amount: number;
    grand_total: number;
    refund_method?: 'cash' | 'card' | 'credit_note' | 'bank_transfer';
    refund_status: 'pending' | 'refunded';
    notes?: string;
    status: 'draft' | 'approved' | 'rejected';
}

export interface SalesReturnItem extends BaseEntity {
    return_id: number;
    invoice_item_id: number;
    product_id: number;
    quantity: number;
    unit_price: number;
    line_total: number;
}

// Payments
export interface Payment extends BaseEntity {
    payment_number: string;
    customer_id?: number;
    vendor_id?: number;
    payment_date: string;
    amount: number;
    payment_method: 'cash' | 'check' | 'bank_transfer' | 'card' | 'other';
    reference_number?: string;
    bank_account_id?: number;
    notes?: string;
    status: 'draft' | 'completed' | 'cancelled';
}

export interface PaymentAllocation extends BaseEntity {
    payment_id: number;
    invoice_id?: number;
    purchase_order_id?: number;
    allocated_amount: number;
}

// Purchases
export interface PurchaseOrder extends BaseEntity {
    po_number: string;
    vendor_id: number;
    order_date: string;
    expected_delivery_date?: string;
    branch_id?: number;
    subtotal: number;
    discount_amount: number;
    tax_amount: number;
    shipping_charges: number;
    grand_total: number;
    notes?: string;
    status: 'draft' | 'sent' | 'confirmed' | 'partially_received' | 'fully_received' | 'cancelled';
}

export interface PurchaseOrderItem extends BaseEntity {
    po_id: number;
    product_id: number;
    description?: string;
    quantity: number;
    quantity_received: number;
    unit_cost: number;
    discount_percent: number;
    tax_rate: number;
    line_total: number;
    sequence: number;
}

export interface GoodsReceivedNote extends BaseEntity {
    grn_number: string;
    po_id: number;
    vendor_id: number;
    received_date: string;
    vendor_invoice_number?: string;
    vendor_invoice_date?: string;
    branch_id?: number;
    notes?: string;
    status: 'draft' | 'completed' | 'cancelled';
}

export interface GRNItem extends BaseEntity {
    grn_id: number;
    po_item_id: number;
    product_id: number;
    ordered_quantity: number;
    received_quantity: number;
    accepted_quantity: number;
    rejected_quantity: number;
    rejection_reason?: string;
    unit_cost: number;
}

export interface PurchaseReturn extends BaseEntity {
    return_number: string;
    po_id?: number;
    grn_id?: number;
    vendor_id: number;
    return_date: string;
    reason: string;
    subtotal: number;
    tax_amount: number;
    grand_total: number;
    refund_method?: 'cash' | 'credit_note' | 'bank_transfer';
    notes?: string;
    status: 'draft' | 'approved' | 'rejected';
}

// Accounting
export interface ChartOfAccount extends BaseEntity {
    account_code: string;
    account_name: string;
    account_type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
    parent_id?: number;
    description?: string;
    is_active: boolean;
}

export interface JournalEntry extends BaseEntity {
    entry_number: string;
    entry_date: string;
    entry_type: 'manual' | 'system';
    reference_type?: string;
    reference_id?: number;
    description?: string;
    total_debit: number;
    total_credit: number;
    status: 'draft' | 'posted' | 'cancelled';
}

export interface JournalEntryLine extends BaseEntity {
    entry_id: number;
    account_id: number;
    description?: string;
    debit_amount: number;
    credit_amount: number;
    sequence: number;
}

export interface BankAccount extends BaseEntity {
    account_name: string;
    bank_name: string;
    account_number: string;
    account_type: 'checking' | 'savings' | 'credit';
    currency?: string;
    opening_balance: number;
    current_balance: number;
    chart_of_account_id?: number;
    is_active: boolean;
}

export interface BankTransaction extends BaseEntity {
    bank_account_id: number;
    transaction_date: string;
    transaction_type: 'debit' | 'credit';
    amount: number;
    description?: string;
    reference_number?: string;
    is_reconciled: boolean;
    reconciled_date?: string;
}

// Stock Management
export interface StockAdjustment extends BaseEntity {
    adjustment_number: string;
    branch_id: number;
    adjustment_date: string;
    adjustment_type: 'increase' | 'decrease';
    reason: string;
    notes?: string;
    status: 'draft' | 'approved' | 'cancelled';
}

export interface StockAdjustmentItem extends BaseEntity {
    adjustment_id: number;
    product_id: number;
    current_quantity: number;
    adjustment_quantity: number;
    new_quantity: number;
    reason?: string;
}

export interface StockTransfer extends BaseEntity {
    transfer_number: string;
    from_branch_id: number;
    to_branch_id: number;
    transfer_date: string;
    notes?: string;
    status: 'pending' | 'in_transit' | 'received' | 'cancelled';
}

export interface StockTransferItem extends BaseEntity {
    transfer_id: number;
    product_id: number;
    quantity: number;
}

export interface DeliveryNote extends BaseEntity {
    delivery_number: string;
    order_id: number;
    customer_id: number;
    delivery_date: string;
    shipping_address?: string;
    carrier_name?: string;
    tracking_number?: string;
    shipping_method?: string;
    notes?: string;
    status: 'pending' | 'in_transit' | 'delivered';
}

export interface DeliveryNoteItem extends BaseEntity {
    delivery_note_id: number;
    order_item_id: number;
    product_id: number;
    quantity_shipped: number;
}

// Price Lists
export interface PriceList extends BaseEntity {
    name: string;
    description?: string;
    price_list_type: 'sales' | 'purchase';
    start_date?: string;
    end_date?: string;
    status: 'active' | 'inactive';
}

export interface PriceListItem extends BaseEntity {
    price_list_id: number;
    product_id: number;
    price: number;
    min_quantity?: number;
}

