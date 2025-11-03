import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  StatisticsCard,
  QuickActionCard,
  RecentTransactionsWidget,
  StockAlertsWidget,
  TopProductsWidget,
  SalesChartWidget,
} from '../components';
import DashboardService from '../services/DashboardService';
import {
  Money24Regular,
  Cart24Regular,
  People24Regular,
  Alert24Regular,
  Receipt24Regular,
  Box24Regular,
} from '@fluentui/react-icons';
import { LoadingSpinner } from '../../../shared/components';
import './DashboardPage.css';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todaysSales: 0,
    pendingOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
    overduePayments: { count: 0, amount: 0 },
  });
  const [salesTrend, setSalesTrend] = useState<any[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [
        todaysSales,
        pendingOrders,
        totalCustomers,
        totalProducts,
        overduePayments,
        trend,
        invoices,
        lowStock,
        topProds,
      ] = await Promise.all([
        DashboardService.getTodaysSales(),
        DashboardService.getPendingOrdersCount(),
        DashboardService.getTotalCustomers(),
        DashboardService.getTotalProducts(),
        DashboardService.getOverduePayments(),
        DashboardService.getSalesTrend(30),
        DashboardService.getRecentInvoices(10),
        DashboardService.getLowStockProducts(5),
        DashboardService.getTopProducts(5),
      ]);

      setStats({
        todaysSales,
        pendingOrders,
        totalCustomers,
        totalProducts,
        overduePayments,
      });
      setSalesTrend(trend);
      setRecentInvoices(invoices);
      setLowStockProducts(lowStock);
      setTopProducts(topProds);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner variant="page" />;
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
      </div>

      {/* Statistics Cards */}
      <div className="dashboard-stats-grid">
        <StatisticsCard
          title="Today's Sales"
          value={stats.todaysSales}
          icon={<Money24Regular />}
          color="green"
          onClick={() => navigate('/sales/invoice/list')}
        />
        <StatisticsCard
          title="Pending Orders"
          value={stats.pendingOrders}
          icon={<Cart24Regular />}
          color="orange"
          onClick={() => navigate('/sales/orders/list')}
        />
        <StatisticsCard
          title="Total Customers"
          value={stats.totalCustomers}
          icon={<People24Regular />}
          color="blue"
          onClick={() => navigate('/customers/list')}
        />
        <StatisticsCard
          title="Overdue Payments"
          value={`${stats.overduePayments.count} (${stats.overduePayments.amount.toFixed(0)})`}
          icon={<Alert24Regular />}
          color="red"
          onClick={() => navigate('/sales/invoice/list?status=overdue')}
        />
        <StatisticsCard
          title="Total Products"
          value={stats.totalProducts}
          icon={<Box24Regular />}
          color="purple"
          onClick={() => navigate('/inventory/product-list')}
        />
      </div>

      {/* Quick Actions */}
      <div className="dashboard-section">
        <h2>Quick Actions</h2>
        <div className="dashboard-actions-grid">
          <QuickActionCard
            title="New Sale"
            description="Create a new invoice"
            icon={<Receipt24Regular />}
            onClick={() => navigate('/sales/invoice/new')}
            color="green"
          />
          <QuickActionCard
            title="New Purchase"
            description="Create a purchase order"
            icon={<Cart24Regular />}
            onClick={() => navigate('/purchases/order/new')}
            color="blue"
          />
          <QuickActionCard
            title="New Customer"
            description="Add a new customer"
            icon={<People24Regular />}
            onClick={() => navigate('/customers/new')}
            color="purple"
          />
          <QuickActionCard
            title="New Product"
            description="Add a new product"
            icon={<Box24Regular />}
            onClick={() => navigate('/inventory/new-product')}
            color="orange"
          />
        </div>
      </div>

      {/* Charts and Widgets */}
      <div className="dashboard-widgets-grid">
        <div className="widget-column">
          <SalesChartWidget data={salesTrend} title="Sales Trend (Last 30 Days)" />
          <TopProductsWidget products={topProducts} />
        </div>
        <div className="widget-column">
          <RecentTransactionsWidget
            transactions={recentInvoices}
            onViewAll={() => navigate('/sales/invoice/list')}
          />
          <StockAlertsWidget
            products={lowStockProducts}
            onViewAll={() => navigate('/inventory/product-list?filter=low_stock')}
          />
        </div>
      </div>
    </div>
  );
}
