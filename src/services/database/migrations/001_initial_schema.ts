// Initial database schema migration
// This migration creates all core tables for the ERP system
// For SQLite: Creates tables using SQL
// For IndexedDB: Object stores are created during database initialization

export const migration_001_initial_schema = `
-- 1. COMPANIES TABLE
CREATE TABLE IF NOT EXISTS companies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  legal_name TEXT,
  registration_number TEXT,
  tax_number TEXT,
  pan_number TEXT,
  gst_number TEXT,
  email TEXT,
  phone TEXT,
  mobile TEXT,
  website TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'USA',
  postal_code TEXT,
  currency_code TEXT DEFAULT 'USD',
  fiscal_year_start TEXT DEFAULT '01-01',
  bank_name TEXT,
  bank_account_number TEXT,
  bank_ifsc_code TEXT,
  logo_url TEXT,
  invoice_prefix TEXT DEFAULT 'INV',
  quotation_prefix TEXT DEFAULT 'QT',
  order_prefix TEXT DEFAULT 'SO',
  po_prefix TEXT DEFAULT 'PO',
  default_payment_terms INTEGER DEFAULT 30,
  terms_and_conditions TEXT,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. BRANCHES TABLE
CREATE TABLE IF NOT EXISTS branches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  contact_person TEXT,
  address_line1 TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  postal_code TEXT,
  is_main_branch INTEGER DEFAULT 0,
  allow_negative_stock INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- 3. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT,
  phone TEXT,
  mobile TEXT,
  employee_code TEXT UNIQUE,
  designation TEXT,
  department TEXT,
  role TEXT NOT NULL,
  branch_id INTEGER,
  allowed_branches TEXT,
  permissions TEXT,
  is_active INTEGER DEFAULT 1,
  last_login DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);

-- 4. TAX SETTINGS TABLE
CREATE TABLE IF NOT EXISTS tax_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL,
  tax_name TEXT NOT NULL,
  tax_code TEXT,
  tax_rate REAL NOT NULL,
  tax_type TEXT NOT NULL,
  apply_to TEXT DEFAULT 'both',
  is_compound INTEGER DEFAULT 0,
  effective_from DATE,
  effective_until DATE,
  is_default INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- 5. CUSTOMER CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS customer_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  discount_percent REAL DEFAULT 0,
  credit_limit REAL DEFAULT 0,
  payment_terms INTEGER DEFAULT 30,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 6. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_code TEXT UNIQUE NOT NULL,
  customer_type TEXT DEFAULT 'individual',
  title TEXT,
  first_name TEXT,
  last_name TEXT,
  company_name TEXT,
  display_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  mobile TEXT,
  website TEXT,
  contact_person TEXT,
  billing_address_line1 TEXT,
  billing_address_line2 TEXT,
  billing_city TEXT,
  billing_state TEXT,
  billing_country TEXT,
  billing_postal_code TEXT,
  same_as_billing INTEGER DEFAULT 1,
  shipping_address_line1 TEXT,
  shipping_address_line2 TEXT,
  shipping_city TEXT,
  shipping_state TEXT,
  shipping_country TEXT,
  shipping_postal_code TEXT,
  tax_number TEXT,
  pan_number TEXT,
  gst_number TEXT,
  customer_category_id INTEGER,
  price_list_id INTEGER,
  payment_terms INTEGER DEFAULT 30,
  credit_limit REAL DEFAULT 0,
  discount_percent REAL DEFAULT 0,
  opening_balance REAL DEFAULT 0,
  current_balance REAL DEFAULT 0,
  total_sales REAL DEFAULT 0,
  notes TEXT,
  tags TEXT,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_category_id) REFERENCES customer_categories(id)
);

-- 7. VENDORS TABLE
CREATE TABLE IF NOT EXISTS vendors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vendor_code TEXT UNIQUE NOT NULL,
  vendor_type TEXT DEFAULT 'company',
  title TEXT,
  first_name TEXT,
  last_name TEXT,
  company_name TEXT,
  display_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  mobile TEXT,
  website TEXT,
  contact_person TEXT,
  billing_address_line1 TEXT,
  billing_city TEXT,
  billing_state TEXT,
  billing_country TEXT,
  billing_postal_code TEXT,
  tax_number TEXT,
  gst_number TEXT,
  payment_terms INTEGER DEFAULT 30,
  bank_name TEXT,
  bank_account_number TEXT,
  bank_ifsc_code TEXT,
  opening_balance REAL DEFAULT 0,
  current_balance REAL DEFAULT 0,
  notes TEXT,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 8. PRODUCT CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS product_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  parent_id INTEGER,
  description TEXT,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES product_categories(id)
);

-- 9. PRODUCT BRANDS TABLE
CREATE TABLE IF NOT EXISTS product_brands (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 10. UNITS OF MEASURE TABLE
CREATE TABLE IF NOT EXISTS units_of_measure (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  unit_name TEXT UNIQUE NOT NULL,
  unit_symbol TEXT,
  unit_type TEXT,
  is_active INTEGER DEFAULT 1
);

-- 11. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_code TEXT UNIQUE NOT NULL,
  barcode TEXT,
  sku TEXT,
  name TEXT NOT NULL,
  description TEXT,
  category_id INTEGER,
  brand_id INTEGER,
  product_type TEXT DEFAULT 'physical',
  track_inventory INTEGER DEFAULT 1,
  unit_of_measure_id INTEGER,
  cost_price REAL DEFAULT 0,
  selling_price REAL DEFAULT 0,
  mrp REAL DEFAULT 0,
  tax_rate REAL DEFAULT 0,
  hsn_code TEXT,
  reorder_level INTEGER DEFAULT 0,
  reorder_quantity INTEGER DEFAULT 0,
  weight REAL,
  weight_unit TEXT,
  length REAL,
  width REAL,
  height REAL,
  primary_image_url TEXT,
  image_urls TEXT,
  preferred_vendor_id INTEGER,
  notes TEXT,
  tags TEXT,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES product_categories(id),
  FOREIGN KEY (brand_id) REFERENCES product_brands(id),
  FOREIGN KEY (unit_of_measure_id) REFERENCES units_of_measure(id),
  FOREIGN KEY (preferred_vendor_id) REFERENCES vendors(id)
);

-- 12. INVENTORY STOCK TABLE
CREATE TABLE IF NOT EXISTS inventory_stock (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  branch_id INTEGER NOT NULL,
  quantity_on_hand REAL DEFAULT 0,
  quantity_reserved REAL DEFAULT 0,
  quantity_available REAL DEFAULT 0,
  quantity_on_order REAL DEFAULT 0,
  average_cost REAL DEFAULT 0,
  total_value REAL DEFAULT 0,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  UNIQUE(product_id, branch_id)
);

-- 13. STOCK MOVEMENTS TABLE
CREATE TABLE IF NOT EXISTS stock_movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  branch_id INTEGER NOT NULL,
  movement_type TEXT NOT NULL,
  quantity REAL NOT NULL,
  unit_cost REAL DEFAULT 0,
  reference_type TEXT,
  reference_id INTEGER,
  reference_number TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);

-- 14. PRICE LISTS TABLE
CREATE TABLE IF NOT EXISTS price_lists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  price_list_type TEXT DEFAULT 'sales',
  valid_from DATE,
  valid_until DATE,
  is_active INTEGER DEFAULT 1,
  is_default INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 15. PRICE LIST ITEMS TABLE
CREATE TABLE IF NOT EXISTS price_list_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  price_list_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  price REAL NOT NULL,
  discount_percent REAL DEFAULT 0,
  FOREIGN KEY (price_list_id) REFERENCES price_lists(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- 16. SALES QUOTATIONS TABLE
CREATE TABLE IF NOT EXISTS sales_quotations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quotation_number TEXT UNIQUE NOT NULL,
  customer_id INTEGER NOT NULL,
  quotation_date DATE NOT NULL,
  valid_until DATE,
  branch_id INTEGER,
  status TEXT DEFAULT 'draft',
  subtotal REAL DEFAULT 0,
  tax_amount REAL DEFAULT 0,
  discount_amount REAL DEFAULT 0,
  discount_type TEXT DEFAULT 'fixed',
  discount_value REAL DEFAULT 0,
  total_amount REAL DEFAULT 0,
  notes TEXT,
  terms_and_conditions TEXT,
  internal_notes TEXT,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 17. SALES QUOTATION ITEMS TABLE
CREATE TABLE IF NOT EXISTS sales_quotation_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quotation_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  description TEXT,
  quantity REAL NOT NULL,
  unit_price REAL NOT NULL,
  tax_rate REAL DEFAULT 0,
  tax_amount REAL DEFAULT 0,
  discount_percent REAL DEFAULT 0,
  discount_amount REAL DEFAULT 0,
  line_total REAL NOT NULL,
  sort_order INTEGER DEFAULT 0,
  FOREIGN KEY (quotation_id) REFERENCES sales_quotations(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- 18. SALES ORDERS TABLE
CREATE TABLE IF NOT EXISTS sales_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_number TEXT UNIQUE NOT NULL,
  customer_id INTEGER NOT NULL,
  order_date DATE NOT NULL,
  delivery_date DATE,
  branch_id INTEGER,
  quotation_id INTEGER,
  status TEXT DEFAULT 'pending',
  payment_status TEXT DEFAULT 'unpaid',
  fulfillment_status TEXT DEFAULT 'unfulfilled',
  subtotal REAL DEFAULT 0,
  tax_amount REAL DEFAULT 0,
  discount_amount REAL DEFAULT 0,
  shipping_charges REAL DEFAULT 0,
  adjustment_amount REAL DEFAULT 0,
  total_amount REAL DEFAULT 0,
  paid_amount REAL DEFAULT 0,
  shipping_address TEXT,
  notes TEXT,
  internal_notes TEXT,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (quotation_id) REFERENCES sales_quotations(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 19. SALES ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS sales_order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  description TEXT,
  quantity REAL NOT NULL,
  quantity_shipped REAL DEFAULT 0,
  quantity_invoiced REAL DEFAULT 0,
  unit_price REAL NOT NULL,
  tax_rate REAL DEFAULT 0,
  tax_amount REAL DEFAULT 0,
  discount_percent REAL DEFAULT 0,
  discount_amount REAL DEFAULT 0,
  line_total REAL NOT NULL,
  sort_order INTEGER DEFAULT 0,
  FOREIGN KEY (order_id) REFERENCES sales_orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- 20. SALES INVOICES TABLE
CREATE TABLE IF NOT EXISTS sales_invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_number TEXT UNIQUE NOT NULL,
  customer_id INTEGER NOT NULL,
  invoice_date DATE NOT NULL,
  due_date DATE,
  order_id INTEGER,
  branch_id INTEGER,
  status TEXT DEFAULT 'draft',
  payment_status TEXT DEFAULT 'unpaid',
  subtotal REAL DEFAULT 0,
  tax_amount REAL DEFAULT 0,
  discount_amount REAL DEFAULT 0,
  shipping_charges REAL DEFAULT 0,
  adjustment_amount REAL DEFAULT 0,
  total_amount REAL DEFAULT 0,
  paid_amount REAL DEFAULT 0,
  balance_due REAL DEFAULT 0,
  notes TEXT,
  terms_and_conditions TEXT,
  internal_notes TEXT,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (order_id) REFERENCES sales_orders(id),
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 21. SALES INVOICE ITEMS TABLE
CREATE TABLE IF NOT EXISTS sales_invoice_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  description TEXT,
  quantity REAL NOT NULL,
  unit_price REAL NOT NULL,
  tax_rate REAL DEFAULT 0,
  tax_amount REAL DEFAULT 0,
  discount_percent REAL DEFAULT 0,
  discount_amount REAL DEFAULT 0,
  line_total REAL NOT NULL,
  sort_order INTEGER DEFAULT 0,
  FOREIGN KEY (invoice_id) REFERENCES sales_invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- 22. SALES RETURNS TABLE
CREATE TABLE IF NOT EXISTS sales_returns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  return_number TEXT UNIQUE NOT NULL,
  invoice_id INTEGER NOT NULL,
  customer_id INTEGER NOT NULL,
  return_date DATE NOT NULL,
  branch_id INTEGER,
  reason TEXT,
  return_type TEXT DEFAULT 'full',
  subtotal REAL DEFAULT 0,
  tax_amount REAL DEFAULT 0,
  total_amount REAL DEFAULT 0,
  refund_method TEXT,
  refund_status TEXT DEFAULT 'pending',
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (invoice_id) REFERENCES sales_invoices(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 23. SALES RETURN ITEMS TABLE
CREATE TABLE IF NOT EXISTS sales_return_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  return_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  description TEXT,
  quantity REAL NOT NULL,
  unit_price REAL NOT NULL,
  tax_rate REAL DEFAULT 0,
  tax_amount REAL DEFAULT 0,
  line_total REAL NOT NULL,
  FOREIGN KEY (return_id) REFERENCES sales_returns(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- 24. PURCHASE ORDERS TABLE
CREATE TABLE IF NOT EXISTS purchase_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  po_number TEXT UNIQUE NOT NULL,
  vendor_id INTEGER NOT NULL,
  order_date DATE NOT NULL,
  expected_delivery_date DATE,
  branch_id INTEGER,
  status TEXT DEFAULT 'draft',
  payment_status TEXT DEFAULT 'unpaid',
  receipt_status TEXT DEFAULT 'pending',
  subtotal REAL DEFAULT 0,
  tax_amount REAL DEFAULT 0,
  discount_amount REAL DEFAULT 0,
  shipping_charges REAL DEFAULT 0,
  adjustment_amount REAL DEFAULT 0,
  total_amount REAL DEFAULT 0,
  paid_amount REAL DEFAULT 0,
  delivery_address TEXT,
  notes TEXT,
  terms_and_conditions TEXT,
  internal_notes TEXT,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id),
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 25. PURCHASE ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  po_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  description TEXT,
  quantity REAL NOT NULL,
  quantity_received REAL DEFAULT 0,
  unit_price REAL NOT NULL,
  tax_rate REAL DEFAULT 0,
  tax_amount REAL DEFAULT 0,
  discount_percent REAL DEFAULT 0,
  discount_amount REAL DEFAULT 0,
  line_total REAL NOT NULL,
  sort_order INTEGER DEFAULT 0,
  FOREIGN KEY (po_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- 26. GOODS RECEIVED NOTES TABLE
CREATE TABLE IF NOT EXISTS goods_received_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  grn_number TEXT UNIQUE NOT NULL,
  po_id INTEGER NOT NULL,
  vendor_id INTEGER NOT NULL,
  received_date DATE NOT NULL,
  branch_id INTEGER,
  status TEXT DEFAULT 'draft',
  vendor_invoice_number TEXT,
  vendor_invoice_date DATE,
  notes TEXT,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (po_id) REFERENCES purchase_orders(id),
  FOREIGN KEY (vendor_id) REFERENCES vendors(id),
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 27. GRN ITEMS TABLE
CREATE TABLE IF NOT EXISTS grn_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  grn_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity_ordered REAL NOT NULL,
  quantity_received REAL NOT NULL,
  unit_price REAL NOT NULL,
  accepted_quantity REAL DEFAULT 0,
  rejected_quantity REAL DEFAULT 0,
  rejection_reason TEXT,
  FOREIGN KEY (grn_id) REFERENCES goods_received_notes(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- 28. PURCHASE RETURNS TABLE
CREATE TABLE IF NOT EXISTS purchase_returns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  return_number TEXT UNIQUE NOT NULL,
  po_id INTEGER NOT NULL,
  vendor_id INTEGER NOT NULL,
  return_date DATE NOT NULL,
  branch_id INTEGER,
  reason TEXT,
  subtotal REAL DEFAULT 0,
  tax_amount REAL DEFAULT 0,
  total_amount REAL DEFAULT 0,
  refund_status TEXT DEFAULT 'pending',
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (po_id) REFERENCES purchase_orders(id),
  FOREIGN KEY (vendor_id) REFERENCES vendors(id),
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 29. PURCHASE RETURN ITEMS TABLE
CREATE TABLE IF NOT EXISTS purchase_return_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  return_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity REAL NOT NULL,
  unit_price REAL NOT NULL,
  tax_rate REAL DEFAULT 0,
  tax_amount REAL DEFAULT 0,
  line_total REAL NOT NULL,
  FOREIGN KEY (return_id) REFERENCES purchase_returns(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- 30. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  payment_number TEXT UNIQUE NOT NULL,
  payment_date DATE NOT NULL,
  payment_type TEXT NOT NULL,
  party_type TEXT NOT NULL,
  party_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  payment_method TEXT NOT NULL,
  reference_number TEXT,
  check_number TEXT,
  check_date DATE,
  bank_account_id INTEGER,
  bank_charges REAL DEFAULT 0,
  exchange_rate REAL DEFAULT 1.0,
  notes TEXT,
  status TEXT DEFAULT 'completed',
  branch_id INTEGER,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 31. PAYMENT ALLOCATIONS TABLE
CREATE TABLE IF NOT EXISTS payment_allocations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  payment_id INTEGER NOT NULL,
  invoice_type TEXT NOT NULL,
  invoice_id INTEGER NOT NULL,
  invoice_number TEXT,
  invoice_amount REAL NOT NULL,
  allocated_amount REAL NOT NULL,
  FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE
);

-- 32. CHART OF ACCOUNTS TABLE
CREATE TABLE IF NOT EXISTS chart_of_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_code TEXT UNIQUE NOT NULL,
  account_name TEXT NOT NULL,
  account_type TEXT NOT NULL,
  account_subtype TEXT,
  parent_account_id INTEGER,
  description TEXT,
  opening_balance REAL DEFAULT 0,
  current_balance REAL DEFAULT 0,
  is_system_account INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_account_id) REFERENCES chart_of_accounts(id)
);

-- 33. JOURNAL ENTRIES TABLE
CREATE TABLE IF NOT EXISTS journal_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_number TEXT UNIQUE NOT NULL,
  entry_date DATE NOT NULL,
  entry_type TEXT DEFAULT 'manual',
  reference_type TEXT,
  reference_id INTEGER,
  description TEXT,
  total_debit REAL NOT NULL,
  total_credit REAL NOT NULL,
  status TEXT DEFAULT 'posted',
  notes TEXT,
  created_by INTEGER,
  approved_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- 34. JOURNAL ENTRY LINES TABLE
CREATE TABLE IF NOT EXISTS journal_entry_lines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_id INTEGER NOT NULL,
  account_id INTEGER NOT NULL,
  description TEXT,
  debit_amount REAL DEFAULT 0,
  credit_amount REAL DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  FOREIGN KEY (entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE,
  FOREIGN KEY (account_id) REFERENCES chart_of_accounts(id)
);

-- 35. BANK ACCOUNTS TABLE
CREATE TABLE IF NOT EXISTS bank_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_name TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_type TEXT,
  branch_name TEXT,
  ifsc_code TEXT,
  swift_code TEXT,
  currency_code TEXT DEFAULT 'USD',
  opening_balance REAL DEFAULT 0,
  current_balance REAL DEFAULT 0,
  branch_id INTEGER,
  chart_account_id INTEGER,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (chart_account_id) REFERENCES chart_of_accounts(id)
);

-- 36. BANK TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS bank_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bank_account_id INTEGER NOT NULL,
  transaction_date DATE NOT NULL,
  transaction_type TEXT NOT NULL,
  amount REAL NOT NULL,
  reference_number TEXT,
  payee_payer TEXT,
  description TEXT,
  payment_id INTEGER,
  is_reconciled INTEGER DEFAULT 0,
  reconciled_date DATE,
  reconciled_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id),
  FOREIGN KEY (payment_id) REFERENCES payments(id),
  FOREIGN KEY (reconciled_by) REFERENCES users(id)
);

-- 37. DELIVERY NOTES TABLE
CREATE TABLE IF NOT EXISTS delivery_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  delivery_number TEXT UNIQUE NOT NULL,
  order_id INTEGER NOT NULL,
  delivery_date DATE NOT NULL,
  customer_id INTEGER NOT NULL,
  branch_id INTEGER,
  delivery_address TEXT,
  tracking_number TEXT,
  carrier_name TEXT,
  shipping_method TEXT,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES sales_orders(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 38. DELIVERY NOTE ITEMS TABLE
CREATE TABLE IF NOT EXISTS delivery_note_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  delivery_note_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity REAL NOT NULL,
  FOREIGN KEY (delivery_note_id) REFERENCES delivery_notes(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- 39. STOCK ADJUSTMENTS TABLE
CREATE TABLE IF NOT EXISTS stock_adjustments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  adjustment_number TEXT UNIQUE NOT NULL,
  adjustment_date DATE NOT NULL,
  adjustment_type TEXT NOT NULL,
  branch_id INTEGER NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'draft',
  notes TEXT,
  created_by INTEGER,
  approved_by INTEGER,
  approved_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- 40. STOCK ADJUSTMENT ITEMS TABLE
CREATE TABLE IF NOT EXISTS stock_adjustment_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  adjustment_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity REAL NOT NULL,
  current_stock REAL,
  new_stock REAL,
  unit_cost REAL DEFAULT 0,
  notes TEXT,
  FOREIGN KEY (adjustment_id) REFERENCES stock_adjustments(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);
`;

