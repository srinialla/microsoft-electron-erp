import type { RibbonConfig } from '../components/ribbon/types';

export const ribbonConfig: RibbonConfig = {
  tabs: [
    {
      id: 'dashboard',
      label: 'Dashboard',
      groups: [
        {
          id: 'dashQuick',
          label: 'Quick Actions',
          items: [
            { id: 'dashNewSale', type: 'button', label: 'New Sale', icon: 'Receipt', size: 'large', onClick: 'sales.new' },
            { id: 'dashNewPurchase', type: 'button', label: 'New Purchase', icon: 'ShoppingCart', size: 'medium', onClick: 'purchases.new' },
            { id: 'dashNewCustomer', type: 'button', label: 'New Customer', icon: 'PersonAdd', size: 'medium', onClick: 'customers.new' },
          ],
        },
        {
          id: 'dashNavigate',
          label: 'Navigate',
          items: [
            { id: 'navCustomers', type: 'button', label: 'Customers', icon: 'People', size: 'small', onClick: 'dashboard.customers' },
            { id: 'navInventory', type: 'button', label: 'Inventory', icon: 'Box', size: 'small', onClick: 'dashboard.inventory' },
            { id: 'navReports', type: 'button', label: 'Reports', icon: 'DataBarVertical', size: 'small', onClick: 'dashboard.reports' },
          ],
        },
      ],
    },
    {
      id: 'sales',
      label: 'Sales',
      groups: [
        {
          id: 'salesTxn', label: 'Transactions',
          items: [
            { id: 'salesQuote', type: 'button', label: 'New Quotation', icon: 'Document', size: 'medium', onClick: 'sales.quotation.new' },
            { id: 'salesInvoice', type: 'button', label: 'New Invoice', icon: 'DocumentText', size: 'large', onClick: 'sales.invoice.new' },
            { id: 'salesReturn', type: 'button', label: 'Sales Return', icon: 'ArrowReply', size: 'medium', onClick: 'sales.return' },
          ],
        },
        {
          id: 'salesOps', label: 'Operations',
          items: [
            { id: 'salesOrdersList', type: 'button', label: 'Sales Orders', icon: 'List', size: 'medium', onClick: 'sales.orders.list' },
            { id: 'salesPayments', type: 'button', label: 'Payments', icon: 'Money', size: 'medium', onClick: 'sales.payments' },
            { id: 'salesDelivery', type: 'button', label: 'Delivery', icon: 'VehicleTruck', size: 'medium', onClick: 'sales.delivery' },
          ],
        },
        {
          id: 'salesReports', label: 'Reports',
          items: [
            { id: 'salesReport', type: 'button', label: 'Sales Report', icon: 'DataBarVertical', size: 'medium', onClick: 'sales.reports' },
          ],
        },
      ],
    },
    {
      id: 'purchases',
      label: 'Purchases',
      groups: [
        {
          id: 'purTxn', label: 'Transactions',
          items: [
            { id: 'purOrder', type: 'button', label: 'Purchase Order', icon: 'Document', size: 'large', onClick: 'purchases.order.new' },
            { id: 'purReceive', type: 'button', label: 'Receive Goods', icon: 'BoxArrowDown', size: 'medium', onClick: 'purchases.goods.receive' },
            { id: 'purReturn', type: 'button', label: 'Purchase Return', icon: 'ArrowReply', size: 'medium', onClick: 'purchases.return' },
          ],
        },
        {
          id: 'purVendors', label: 'Vendors',
          items: [
            { id: 'purNewVendor', type: 'button', label: 'New Vendor', icon: 'Building', size: 'medium', onClick: 'purchases.vendor.new' },
            { id: 'purVendorList', type: 'button', label: 'Vendor List', icon: 'List', size: 'medium', onClick: 'purchases.vendor.list' },
          ],
        },
        {
          id: 'purReports', label: 'Reports',
          items: [
            { id: 'purReport', type: 'button', label: 'Purchase Report', icon: 'DataBarVertical', size: 'medium', onClick: 'purchases.reports' },
          ],
        },
      ],
    },
    {
      id: 'inventory',
      label: 'Inventory',
      groups: [
        {
          id: 'invProducts', label: 'Products',
          items: [
            { id: 'invNewProduct', type: 'button', label: 'New Product', icon: 'BoxAdd', size: 'large', onClick: 'inventory.product.new' },
            { id: 'invImport', type: 'button', label: 'Import Products', icon: 'ArrowUpload', size: 'medium', onClick: 'inventory.import' },
            { id: 'invUpdatePrice', type: 'button', label: 'Update Price', icon: 'Tag', size: 'medium', onClick: 'inventory.updateprice' },
          ],
        },
        {
          id: 'invStock', label: 'Stock',
          items: [
            { id: 'invAdjustment', type: 'button', label: 'Stock Adjustment', icon: 'Edit', size: 'medium', onClick: 'inventory.adjustment' },
            { id: 'invTransfer', type: 'button', label: 'Stock Transfer', icon: 'ArrowSwap', size: 'medium', onClick: 'inventory.transfer' },
            { id: 'invCount', type: 'button', label: 'Physical Count', icon: 'Clipboard', size: 'medium', onClick: 'inventory.count' },
          ],
        },
        {
          id: 'invReports', label: 'Reports',
          items: [
            { id: 'invStockReport', type: 'button', label: 'Stock Report', icon: 'DataBarVertical', size: 'medium', onClick: 'inventory.stockreport' },
            { id: 'invValuation', type: 'button', label: 'Valuation', icon: 'Money', size: 'small', onClick: 'inventory.valuation' },
          ],
        },
      ],
    },
    {
      id: 'customers',
      label: 'Customers',
      groups: [
        {
          id: 'custManage', label: 'Manage',
          items: [
            { id: 'custNew', type: 'button', label: 'New Customer', icon: 'PersonAdd', size: 'large', onClick: 'customers.new' },
            { id: 'custList', type: 'button', label: 'Customer List', icon: 'People', size: 'medium', onClick: 'customers.list' },
          ],
        },

        {
          id: 'custReports', label: 'Reports',
          items: [
            { id: 'custReport', type: 'button', label: 'Customer Report', icon: 'Document', size: 'medium', onClick: 'customers.report' },
          ],
        },
      ],
    },
    {
      id: 'accounting',
      label: 'Accounting',
      groups: [
        {
          id: 'accTxn', label: 'Transactions',
          items: [
            { id: 'accJournal', type: 'button', label: 'Journal Entry', icon: 'BookOpen', size: 'large', onClick: 'accounting.journalentry' },
            { id: 'accPayment', type: 'button', label: 'Payment', icon: 'Wallet', size: 'medium', onClick: 'accounting.payment' },
            { id: 'accReceipt', type: 'button', label: 'Receipt', icon: 'Money', size: 'medium', onClick: 'accounting.receipt' },
          ],
        },
        {
          id: 'accBanking', label: 'Banking',
          items: [
            { id: 'accBankRec', type: 'button', label: 'Bank Reconciliation', icon: 'Bank', size: 'medium', onClick: 'accounting.bankrec' },
            { id: 'accDeposit', type: 'button', label: 'Deposits', icon: 'ArrowDown', size: 'small', onClick: 'accounting.deposit' },
            { id: 'accWithdraw', type: 'button', label: 'Withdrawals', icon: 'ArrowUp', size: 'small', onClick: 'accounting.withdrawal' },
          ],
        },
        {
          id: 'accReports', label: 'Reports',
          items: [
            { id: 'accTrial', type: 'button', label: 'Trial Balance', icon: 'ScaleBalanced', size: 'medium', onClick: 'accounting.trialbalance' },
            { id: 'accPL', type: 'button', label: 'P&L Statement', icon: 'ArrowTrending', size: 'medium', onClick: 'accounting.pnl' },
            { id: 'accBalanceSheet', type: 'button', label: 'Balance Sheet', icon: 'TableCells', size: 'medium', onClick: 'accounting.balancesheet' },
          ],
        },
      ],
    },
    {
      id: 'reports',
      label: 'Reports',
      groups: [
        {
          id: 'rptFinancial', label: 'Financial',
          items: [
            { id: 'rptIncome', type: 'button', label: 'Income Statement', icon: 'ArrowTrending', size: 'medium', onClick: 'reports.income' },
            { id: 'rptBalance', type: 'button', label: 'Balance Sheet', icon: 'ScaleBalanced', size: 'medium', onClick: 'reports.balancesheet' },
            { id: 'rptCashFlow', type: 'button', label: 'Cash Flow', icon: 'Pulse', size: 'medium', onClick: 'reports.cashflow' },
          ],
        },
        {
          id: 'rptSales', label: 'Sales',
          items: [
            { id: 'rptSalesSummary', type: 'button', label: 'Sales Summary', icon: 'Receipt', size: 'medium', onClick: 'reports.sales.summary' },
            { id: 'rptSalesByCustomer', type: 'button', label: 'By Customer', icon: 'Person', size: 'small', onClick: 'reports.sales.bycustomer' },
            { id: 'rptSalesByProduct', type: 'button', label: 'By Product', icon: 'Box', size: 'small', onClick: 'reports.sales.byproduct' },
          ],
        },
        {
          id: 'rptInventory', label: 'Inventory',
          items: [
            { id: 'rptStock', type: 'button', label: 'Stock Report', icon: 'Box', size: 'medium', onClick: 'reports.stockreport' },
            { id: 'rptValuation', type: 'button', label: 'Valuation', icon: 'Money', size: 'small', onClick: 'reports.valuation' },
          ],
        },
        {
          id: 'rptExport', label: 'Export',
          items: [
            { id: 'rptExcel', type: 'button', label: 'Excel', icon: 'ExcelLogo', size: 'medium', onClick: 'reports.excel' },
            { id: 'rptPDF', type: 'button', label: 'PDF', icon: 'DocumentPdf', size: 'medium', onClick: 'reports.pdf' },
            { id: 'rptPrint', type: 'button', label: 'Print', icon: 'Print', size: 'small', onClick: 'reports.print' },
          ],
        },
      ],
    },
    {
      id: 'settings',
      label: 'Settings',
      groups: [
        {
          id: 'setCompany', label: 'Company',
          items: [
            { id: 'companyProfile', type: 'button', label: 'Company Profile', icon: 'Building', size: 'medium', onClick: 'company.profile' },
            { id: 'branches', type: 'button', label: 'Branches', icon: 'Branch', size: 'small', onClick: 'company.branches' },
          ],
        },
        {
          id: 'setSystem', label: 'System',
          items: [
            { id: 'taxSettings', type: 'button', label: 'Tax Settings', icon: 'Calculator', size: 'small', onClick: 'company.taxsettings' },
            { id: 'currency', type: 'button', label: 'Currency', icon: 'Money', size: 'small', onClick: 'company.currency' },
            { id: 'users', type: 'button', label: 'Users & Roles', icon: 'People', size: 'small', onClick: 'company.users' },
          ],
        },
      ],
    },
  ],
};
