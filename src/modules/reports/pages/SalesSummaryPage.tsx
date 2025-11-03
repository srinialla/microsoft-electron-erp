import React, { useState, useEffect } from 'react';
import { DataGrid } from '../../../shared/components';
import { Button } from '../../../renderer/components/ui/Button';
import { FormDatePicker } from '../../../shared/components';
import ReportsService from '../services/ReportsService';
import { formatCurrency, formatPercentage } from '../../../shared/utils/formatting';
import { LoadingSpinner } from '../../../shared/components';
import { useToastController, useId } from '@fluentui/react-components';
import { ArrowDownload24Regular, Print24Regular } from '@fluentui/react-icons';

export default function SalesSummaryPage() {
  const toasterId = useId('toaster');
  const { dispatchToast } = useToastController(toasterId);

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [dateTo, setDateTo] = useState<Date | undefined>(new Date());

  useEffect(() => {
    loadReport();
  }, [dateFrom, dateTo]);

  const loadReport = async () => {
    try {
      setLoading(true);
      const data = await ReportsService.getSalesSummary(
        dateFrom?.toISOString().split('T')[0],
        dateTo?.toISOString().split('T')[0],
      );
      setSummary(data);
    } catch (error) {
      dispatchToast(<div>Failed to load sales summary: {(error as Error).message}</div>, {
        intent: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const data = await ReportsService.getSalesSummary(
        dateFrom?.toISOString().split('T')[0],
        dateTo?.toISOString().split('T')[0],
      );
      await ReportsService.exportToCSV([data], 'sales-summary');
      dispatchToast(<div>Report exported successfully</div>, { intent: 'success' });
    } catch (error) {
      dispatchToast(<div>Failed to export report: {(error as Error).message}</div>, {
        intent: 'error',
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <LoadingSpinner variant="page" />;
  }

  if (!summary) {
    return <div style={{ padding: '24px' }}>No data available</div>;
  }

  return (
    <div style={{ padding: '24px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        <h1>Sales Summary Report</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button variant="outline" icon={<ArrowDownload24Regular />} onClick={handleExport}>
            Export CSV
          </Button>
          <Button variant="outline" icon={<Print24Regular />} onClick={handlePrint}>
            Print
          </Button>
        </div>
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

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '32px',
        }}
      >
        <div style={{ padding: '20px', border: '1px solid #e1e1e1', borderRadius: '8px' }}>
          <div style={{ fontSize: '14px', color: '#616161', marginBottom: '8px' }}>Total Sales</div>
          <div style={{ fontSize: '24px', fontWeight: 600, color: '#107c10' }}>
            {formatCurrency(summary.total_sales)}
          </div>
        </div>
        <div style={{ padding: '20px', border: '1px solid #e1e1e1', borderRadius: '8px' }}>
          <div style={{ fontSize: '14px', color: '#616161', marginBottom: '8px' }}>Total Cost</div>
          <div style={{ fontSize: '24px', fontWeight: 600, color: '#616161' }}>
            {formatCurrency(summary.total_cost)}
          </div>
        </div>
        <div style={{ padding: '20px', border: '1px solid #e1e1e1', borderRadius: '8px' }}>
          <div style={{ fontSize: '14px', color: '#616161', marginBottom: '8px' }}>
            Total Profit
          </div>
          <div style={{ fontSize: '24px', fontWeight: 600, color: '#107c10' }}>
            {formatCurrency(summary.total_profit)}
          </div>
        </div>
        <div style={{ padding: '20px', border: '1px solid #e1e1e1', borderRadius: '8px' }}>
          <div style={{ fontSize: '14px', color: '#616161', marginBottom: '8px' }}>
            Profit Margin
          </div>
          <div style={{ fontSize: '24px', fontWeight: 600, color: '#107c10' }}>
            {formatPercentage(summary.profit_margin)}
          </div>
        </div>
        <div style={{ padding: '20px', border: '1px solid #e1e1e1', borderRadius: '8px' }}>
          <div style={{ fontSize: '14px', color: '#616161', marginBottom: '8px' }}>
            Invoice Count
          </div>
          <div style={{ fontSize: '24px', fontWeight: 600 }}>{summary.invoice_count}</div>
        </div>
        <div style={{ padding: '20px', border: '1px solid #e1e1e1', borderRadius: '8px' }}>
          <div style={{ fontSize: '14px', color: '#616161', marginBottom: '8px' }}>
            Average Invoice
          </div>
          <div style={{ fontSize: '24px', fontWeight: 600 }}>
            {formatCurrency(summary.average_invoice)}
          </div>
        </div>
      </div>
    </div>
  );
}
