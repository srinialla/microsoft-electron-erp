import type { ActionRegistry } from '../components/ribbon/types';
import { NavigateFunction } from 'react-router-dom';

export function buildRibbonActions(
  navigate: NavigateFunction,
  setOpenDialog: (v: string | null) => void,
): ActionRegistry {
  return {
    // Navigation - Full page forms
    'sales.new': () => navigate('/sales/invoice/new'),
    'purchases.new': () => navigate('/purchases/order/new'),
    'purchases.vendor.new': () => navigate('/purchases/vendor/new'),
    'inventory.product.new': () => navigate('/inventory/new-product'),
    // Navigation continues as before
    // Dashboard Quick Actions
    'dashboard.customers': () => navigate('/customers/list'),
    'dashboard.inventory': () => navigate('/inventory/product-list'),
    'dashboard.reports': () => navigate('/reports'),
    // Customers
    'customers.list': () => navigate('/customers/list'),
    'customers.new': () => navigate('/customers/new'),
    'customers.edit': () => console.warn('TODO: Edit Customer'),
    'customers.delete': () => console.warn('TODO: Delete Customer'),
    'customers.report': () => navigate('/reports/by-customer'),
    // Inventory
    'inventory.product.list': () => navigate('/inventory/product-list'),
    'inventory.import': () => navigate('/inventory/import'),
    'inventory.updateprice': () => navigate('/inventory/update-price'),
    'inventory.adjustment': () => navigate('/inventory/stock-adjustment'),
    'inventory.transfer': () => navigate('/inventory/stock-transfer'),
    'inventory.count': () => navigate('/inventory/physical-count'),
    'inventory.stockreport': () => navigate('/inventory/stock-report'),
    'inventory.valuation': () => navigate('/inventory/valuation'),
    // Sales - navigate to concrete sub-routes
    'sales.quotation.list': () => navigate('/sales/quotation/list'),
    'sales.quotation.new': () => navigate('/sales/quotation/new'),
    'sales.invoice.new': () => navigate('/sales/invoice/new'),
    'sales.return': () => navigate('/sales/return/new'),
    'sales.orders.list': () => navigate('/sales/orders/list'),
    'sales.payments': () => navigate('/sales/payments/new'),
    'sales.delivery': () => navigate('/sales/delivery'),
    'sales.reports': () => navigate('/sales/reports'),
    // Purchases - concrete sub-routes
    'purchases.order.new': () => navigate('/purchases/order/new'),
    'purchases.goods.receive': () => navigate('/purchases/goods-received/new'),
    'purchases.return': () => navigate('/purchases/return/new'),
    'purchases.vendor.list': () => navigate('/purchases/vendors/list'),
    'purchases.reports': () => navigate('/purchases/reports'),
    // Accounting
    'accounting.journalentry': () => navigate('/accounting/journal-entry'),
    'accounting.payment': () => navigate('/accounting/payment'),
    'accounting.receipt': () => navigate('/accounting/receipt'),
    'accounting.bankrec': () => navigate('/accounting/bank-reconciliation'),
    'accounting.deposit': () => navigate('/accounting/deposit'),
    'accounting.withdrawal': () => navigate('/accounting/withdrawal'),
    'accounting.trialbalance': () => navigate('/accounting/trial-balance'),
    'accounting.pnl': () => navigate('/accounting/pnl'),
    'accounting.balancesheet': () => navigate('/accounting/balance-sheet'),
    // Reports
    'reports.income': () => navigate('/reports/income-statement'),
    'reports.balancesheet': () => navigate('/reports/balance-sheet'),
    'reports.cashflow': () => navigate('/reports/cash-flow'),
    'reports.sales.summary': () => navigate('/reports/sales-summary'),
    'reports.sales.bycustomer': () => navigate('/reports/by-customer'),
    'reports.sales.byproduct': () => navigate('/reports/by-product'),
    'reports.stockreport': () => navigate('/inventory/stock-report'),
    'reports.valuation': () => navigate('/inventory/valuation'),
    'reports.excel': () => navigate('/reports/excel'),
    'reports.pdf': () => navigate('/reports/pdf'),
    'reports.print': () => navigate('/reports/print'),
    // System/Settings - specific pages
    'company.profile': () => navigate('/settings/company-profile'),
    'company.branches': () => navigate('/settings/branches'),
    'company.taxsettings': () => navigate('/settings/tax-settings'),
    'company.currency': () => navigate('/settings/currency'),
    'company.users': () => navigate('/settings/users-roles'),
    // Extra for completeness
    'app.print': () => window.print(),
    'app.refresh': () => window.location.reload(),
    'nav.dashboard': () => navigate('/'),
    'nav.sales': () => navigate('/sales'),
    'nav.purchases': () => navigate('/purchases'),
    'nav.customers': () => navigate('/customers/list'),
    'nav.inventory': () => navigate('/inventory/product-list'),
    'nav.reports': () => navigate('/reports'),
    'nav.settings': () => navigate('/settings'),
    'nav.accounting': () => navigate('/accounting'),
  };
}
