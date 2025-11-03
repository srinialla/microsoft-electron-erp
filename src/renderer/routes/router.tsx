import React from 'react';
import { createBrowserRouter, createRoutesFromElements, Route } from 'react-router-dom';
import { AppLayout } from '../ui/AppLayout';
import { DashboardPage } from '../pages/Dashboard';
import { InventoryPage } from '../pages/Inventory';
import { SalesPage } from '../pages/Sales';
import { PurchasesPage } from '../pages/Purchases';
import { CustomersPage } from '../pages/Customers';
import { ReportsPage } from '../pages/Reports';
import { SettingsPage } from '../pages/Settings';
import { NotFoundPage } from '../pages/NotFound';
import { LoginPage } from '../pages/Login';
import { Protected } from './Protected';
import { AccountingPage } from '../pages/Accounting';
// Inventory sub-pages
import ProductListPage from '../../modules/inventory/pages/ProductListPage';
import ProductFormPage from '../../modules/inventory/pages/ProductFormPage';
import ImportProductsPage from '../../modules/inventory/pages/ImportProductsPage';
import UpdatePricePage from '../../modules/inventory/pages/UpdatePricePage';
import StockAdjustmentPage from '../../modules/inventory/pages/StockAdjustmentPage';
import StockTransferPage from '../../modules/inventory/pages/StockTransferPage';
import PhysicalCountPage from '../../modules/inventory/pages/PhysicalCountPage';
import StockReportPage from '../../modules/inventory/pages/StockReportPage';
import ValuationPage from '../../modules/inventory/pages/ValuationPage';
// Customers sub-pages
import CustomerListPage from '../../modules/customers/pages/CustomerListPage';
import CustomerFormPage from '../../modules/customers/pages/CustomerFormPage';
import CustomerViewPage from '../../modules/customers/pages/CustomerViewPage';
// Accounting sub-pages
import JournalEntryPage from '../../modules/accounting/pages/JournalEntryPage';
import PaymentPage from '../../modules/accounting/pages/PaymentPage';
import ReceiptPage from '../../modules/accounting/pages/ReceiptPage';
import BankReconciliationPage from '../../modules/accounting/pages/BankReconciliationPage';
import DepositPage from '../../modules/accounting/pages/DepositPage';
import WithdrawalPage from '../../modules/accounting/pages/WithdrawalPage';
import TrialBalancePage from '../../modules/accounting/pages/TrialBalancePage';
import ProfitAndLossPage from '../../modules/accounting/pages/ProfitAndLossPage';
import BalanceSheetPage from '../../modules/accounting/pages/BalanceSheetPage';
// Reports sub-pages
import IncomeStatementPage from '../../modules/reports/pages/IncomeStatementPage';
import BalanceSheetReportPage from '../../modules/reports/pages/BalanceSheetReportPage';
import CashFlowPage from '../../modules/reports/pages/CashFlowPage';
import SalesSummaryPage from '../../modules/reports/pages/SalesSummaryPage';
import SalesByCustomerPage from '../../modules/reports/pages/SalesByCustomerPage';
import SalesByProductPage from '../../modules/reports/pages/SalesByProductPage';
import ExcelExportPage from '../../modules/reports/pages/ExcelExportPage';
import PDFExportPage from '../../modules/reports/pages/PDFExportPage';
import PrintReportPage from '../../modules/reports/pages/PrintReportPage';
// Sales sub-pages
import QuotationFormPage from '../../modules/sales/pages/QuotationFormPage';
import QuotationListPage from '../../modules/sales/pages/QuotationListPage';
import InvoiceFormPage from '../../modules/sales/pages/InvoiceFormPage';
import InvoiceListPage from '../../modules/sales/pages/InvoiceListPage';
import SalesOrderFormPage from '../../modules/sales/pages/SalesOrderFormPage';
import SalesOrderListPage from '../../modules/sales/pages/SalesOrderListPage';
import SalesReturnFormPage from '../../modules/sales/pages/SalesReturnFormPage';
import SalesReturnListPage from '../../modules/sales/pages/SalesReturnListPage';
import PaymentFormPage from '../../modules/sales/pages/PaymentFormPage';
import PaymentListPage from '../../modules/sales/pages/PaymentListPage';
import DeliveryNotesPage from '../../modules/sales/pages/DeliveryNotesPage';
import SalesReportsPage from '../../modules/sales/pages/SalesReportsPage';
// Purchases sub-pages
import PurchaseOrderFormPage from '../../modules/purchases/pages/PurchaseOrderFormPage';
import PurchaseOrderListPage from '../../modules/purchases/pages/PurchaseOrderListPage';
import GoodsReceivedFormPage from '../../modules/purchases/pages/GoodsReceivedFormPage';
import GoodsReceivedListPage from '../../modules/purchases/pages/GoodsReceivedListPage';
import PurchaseReturnFormPage from '../../modules/purchases/pages/PurchaseReturnFormPage';
import PurchaseReturnListPage from '../../modules/purchases/pages/PurchaseReturnListPage';
import VendorListPage from '../../modules/purchases/pages/VendorListPage';
import VendorFormPage from '../../modules/purchases/pages/VendorFormPage';
import PurchaseReportsPage from '../../modules/purchases/pages/PurchaseReportsPage';
// Settings sub-pages
import SettingsCompanyProfilePage from '../../modules/settings/pages/SettingsCompanyProfilePage';
import SettingsBranchesPage from '../../modules/settings/pages/SettingsBranchesPage';
import SettingsTaxSettingsPage from '../pages/SettingsTaxSettingsPage';
import SettingsCurrencyPage from '../pages/SettingsCurrencyPage';
import SettingsUsersRolesPage from '../pages/SettingsUsersRolesPage';
import SettingsUnitsOfMeasurePage from '../../modules/settings/pages/SettingsUnitsOfMeasurePage';

export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/">
      <Route path="login" element={<LoginPage />} />
      <Route
        element={
          <Protected>
            <AppLayout />
          </Protected>
        }
      >
        <Route index element={<DashboardPage />} />
        {/* Inventory sub-routes */}
        <Route path="inventory" element={<InventoryPage />}>
          <Route index element={<ProductListPage />} />
          <Route path="product-list" element={<ProductListPage />} />
          <Route path="new-product" element={<ProductFormPage />} />
          <Route path="edit-product/:id" element={<ProductFormPage />} />
          <Route path="import" element={<ImportProductsPage />} />
          <Route path="update-price" element={<UpdatePricePage />} />
          <Route path="stock-adjustment" element={<StockAdjustmentPage />} />
          <Route path="stock-transfer" element={<StockTransferPage />} />
          <Route path="physical-count" element={<PhysicalCountPage />} />
          <Route path="stock-report" element={<StockReportPage />} />
          <Route path="valuation" element={<ValuationPage />} />
        </Route>
        {/* Customers sub-routes */}
        <Route path="customers" element={<CustomersPage />}>
          <Route index element={<CustomerListPage />} />
          <Route path="list" element={<CustomerListPage />} />
          <Route path="new" element={<CustomerFormPage />} />
          <Route path="edit/:id" element={<CustomerFormPage />} />
          <Route path="view/:id" element={<CustomerViewPage />} />
        </Route>
        {/* Sales sub-routes */}
        <Route path="sales" element={<SalesPage />}>
          <Route index element={<SalesOrderListPage />} />
          <Route path="quotation/new" element={<QuotationFormPage />} />
          <Route path="quotation/list" element={<QuotationListPage />} />
          <Route path="invoice/new" element={<InvoiceFormPage />} />
          <Route path="invoice/list" element={<InvoiceListPage />} />
          <Route path="orders/new" element={<SalesOrderFormPage />} />
          <Route path="orders/list" element={<SalesOrderListPage />} />
          <Route path="return/new" element={<SalesReturnFormPage />} />
          <Route path="return/list" element={<SalesReturnListPage />} />
          <Route path="payments/new" element={<PaymentFormPage />} />
          <Route path="payments/list" element={<PaymentListPage />} />
          <Route path="delivery" element={<DeliveryNotesPage />} />
          <Route path="reports" element={<SalesReportsPage />} />
        </Route>
        {/* Purchases sub-routes */}
        <Route path="purchases" element={<PurchasesPage />}>
          <Route index element={<PurchaseOrderListPage />} />
          <Route path="order/new" element={<PurchaseOrderFormPage />} />
          <Route path="order/list" element={<PurchaseOrderListPage />} />
          <Route path="goods-received/new" element={<GoodsReceivedFormPage />} />
          <Route path="goods-received/list" element={<GoodsReceivedListPage />} />
          <Route path="return/new" element={<PurchaseReturnFormPage />} />
          <Route path="return/list" element={<PurchaseReturnListPage />} />
          <Route path="vendors/list" element={<VendorListPage />} />
          <Route path="vendor/new" element={<VendorFormPage />} />
          <Route path="vendor/edit/:id" element={<VendorFormPage />} />
          <Route path="reports" element={<PurchaseReportsPage />} />
        </Route>
        {/* Accounting sub-routes */}
        <Route path="accounting" element={<AccountingPage />}>
          <Route index element={<TrialBalancePage />} />
          <Route path="journal-entry" element={<JournalEntryPage />} />
          <Route path="payment" element={<PaymentPage />} />
          <Route path="receipt" element={<ReceiptPage />} />
          <Route path="bank-reconciliation" element={<BankReconciliationPage />} />
          <Route path="deposit" element={<DepositPage />} />
          <Route path="withdrawal" element={<WithdrawalPage />} />
          <Route path="trial-balance" element={<TrialBalancePage />} />
          <Route path="pnl" element={<ProfitAndLossPage />} />
          <Route path="balance-sheet" element={<BalanceSheetPage />} />
        </Route>
        {/* Reports sub-routes */}
        <Route path="reports" element={<ReportsPage />}>
          <Route index element={<SalesSummaryPage />} />
          <Route path="income-statement" element={<IncomeStatementPage />} />
          <Route path="balance-sheet" element={<BalanceSheetReportPage />} />
          <Route path="cash-flow" element={<CashFlowPage />} />
          <Route path="sales-summary" element={<SalesSummaryPage />} />
          <Route path="by-customer" element={<SalesByCustomerPage />} />
          <Route path="by-product" element={<SalesByProductPage />} />
          <Route path="excel" element={<ExcelExportPage />} />
          <Route path="pdf" element={<PDFExportPage />} />
          <Route path="print" element={<PrintReportPage />} />
        </Route>
        {/* Base elements removed; index routes handle defaults */}
        <Route path="settings" element={<SettingsPage />}>
          <Route index element={<SettingsCompanyProfilePage />} />
          <Route path="company-profile" element={<SettingsCompanyProfilePage />} />
          <Route path="branches" element={<SettingsBranchesPage />} />
          <Route path="tax-settings" element={<SettingsTaxSettingsPage />} />
          <Route path="currency" element={<SettingsCurrencyPage />} />
          <Route path="users-roles" element={<SettingsUsersRolesPage />} />
          <Route path="units-of-measure" element={<SettingsUnitsOfMeasurePage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Route>,
  ),
  { basename: '/' },
);
