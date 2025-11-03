import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, formatDate } from '../../../shared/utils/formatting';
import { StatusBadge } from '../../../shared/components';
import type { SalesInvoice } from '../../../shared/types/entities';
import './RecentTransactionsWidget.css';

export interface RecentTransactionsWidgetProps {
  transactions: SalesInvoice[];
  onViewAll?: () => void;
}

export const RecentTransactionsWidget: React.FC<RecentTransactionsWidgetProps> = ({
  transactions,
  onViewAll,
}) => {
  const navigate = useNavigate();

  return (
    <div className="recent-transactions-widget">
      <div className="widget-header">
        <h3>Recent Transactions</h3>
        {onViewAll && (
          <button className="widget-view-all" onClick={onViewAll}>
            View All
          </button>
        )}
      </div>
      <div className="widget-content">
        {transactions.length === 0 ? (
          <div className="widget-empty">No recent transactions</div>
        ) : (
          <table className="transactions-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr
                  key={transaction.id}
                  onClick={() => navigate(`/sales/invoice/view/${transaction.id}`)}
                  className="transaction-row"
                >
                  <td>{transaction.invoice_number}</td>
                  <td>{formatDate(transaction.invoice_date)}</td>
                  <td>{transaction.customer_id}</td>
                  <td>{formatCurrency(transaction.grand_total)}</td>
                  <td>
                    <StatusBadge status={transaction.status as any} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default RecentTransactionsWidget;
