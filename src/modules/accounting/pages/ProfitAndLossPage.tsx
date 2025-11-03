import React, { useState, useEffect } from 'react';
import { FormDatePicker, LoadingSpinner } from '../../../shared/components';
import ReportsService from '../../reports/services/ReportsService';
import { formatCurrency } from '../../../shared/utils/formatting';
import { useToastController, useId } from '@fluentui/react-components';
import { ArrowDownload24Regular } from '@fluentui/react-icons';
import { Button } from '../../../renderer/components/ui/Button';

export default function ProfitAndLossPage() {
  const toasterId = useId('toaster');
  const { dispatchToast } = useToastController(toasterId);

  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(
    new Date(new Date().getFullYear(), 0, 1),
  );
  const [dateTo, setDateTo] = useState<Date | undefined>(new Date());
  const [pnlData, setPnlData] = useState<{
    revenue: number;
    cogs: number;
    gross_profit: number;
    expenses: number;
    net_income: number;
  } | null>(null);

  useEffect(() => {
    loadProfitAndLoss();
  }, [dateFrom, dateTo]);

  const loadProfitAndLoss = async () => {
    try {
      setLoading(true);
      const data = await ReportsService.getIncomeStatement(
        dateFrom?.toISOString().split('T')[0],
        dateTo?.toISOString().split('T')[0],
      );
      setPnlData(data);
    } catch (error) {
      dispatchToast(<div>Failed to load profit & loss: {(error as Error).message}</div>, {
        intent: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!pnlData) return;

    const csv = [
      'Profit & Loss Statement',
      `Period: ${dateFrom?.toISOString().split('T')[0]} to ${dateTo?.toISOString().split('T')[0]}`,
      '',
      'Item,Amount',
      `Revenue,${pnlData.revenue}`,
      `Cost of Goods Sold,${pnlData.cogs}`,
      `Gross Profit,${pnlData.gross_profit}`,
      `Expenses,${pnlData.expenses}`,
      `Net Income,${pnlData.net_income}`,
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `profit_loss_${dateFrom?.toISOString().split('T')[0]}_${dateTo?.toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    dispatchToast(<div>Profit & Loss statement exported successfully</div>, { intent: 'success' });
  };

  if (loading) {
    return <LoadingSpinner variant="page" />;
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        <h1>Profit & Loss Statement</h1>
        <Button variant="outline" onClick={handleExport} icon={<ArrowDownload24Regular />}>
          Export CSV
        </Button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <FormDatePicker
          label="From Date"
          name="date_from"
          value={dateFrom}
          onChange={setDateFrom}
        />
        <FormDatePicker label="To Date" name="date_to" value={dateTo} onChange={setDateTo} />
      </div>

      {pnlData && (
        <div style={{ background: '#fff', borderRadius: '8px', padding: '24px' }}>
          <h2 style={{ marginTop: 0, textAlign: 'center', marginBottom: '32px' }}>
            Profit & Loss Statement
          </h2>

          <div style={{ display: 'grid', gap: '16px' }}>
            {/* Revenue */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '16px',
                background: '#f5f5f5',
                borderRadius: '4px',
                fontSize: '16px',
              }}
            >
              <span style={{ fontWeight: 600 }}>Revenue</span>
              <span style={{ fontWeight: 600 }}>{formatCurrency(pnlData.revenue)}</span>
            </div>

            {/* COGS */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '16px',
                fontSize: '16px',
              }}
            >
              <span>Cost of Goods Sold</span>
              <span>({formatCurrency(pnlData.cogs)})</span>
            </div>

            {/* Gross Profit */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '16px',
                background: '#e8f4f8',
                borderRadius: '4px',
                fontSize: '18px',
                fontWeight: 600,
                borderTop: '2px solid #0078d4',
                borderBottom: '2px solid #0078d4',
              }}
            >
              <span>Gross Profit</span>
              <span>{formatCurrency(pnlData.gross_profit)}</span>
            </div>

            {/* Expenses */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '16px',
                fontSize: '16px',
              }}
            >
              <span>Operating Expenses</span>
              <span>({formatCurrency(pnlData.expenses)})</span>
            </div>

            {/* Net Income */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '20px',
                background: pnlData.net_income >= 0 ? '#d4edda' : '#f8d7da',
                borderRadius: '4px',
                fontSize: '20px',
                fontWeight: 600,
                color: pnlData.net_income >= 0 ? '#155724' : '#721c24',
              }}
            >
              <span>Net Income</span>
              <span>{formatCurrency(pnlData.net_income)}</span>
            </div>
          </div>

          <div
            style={{
              marginTop: '24px',
              padding: '16px',
              background: '#fff4e6',
              borderRadius: '4px',
              fontSize: '14px',
              color: '#856404',
            }}
          >
            <strong>Note:</strong> This is a simplified P&L statement. In a full implementation, it
            would include detailed breakdown of revenue, COGS, and expenses by account categories.
          </div>
        </div>
      )}
    </div>
  );
}
