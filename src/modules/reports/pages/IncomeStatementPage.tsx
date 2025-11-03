import React, { useState, useEffect } from 'react';
import { Button } from '../../../renderer/components/ui/Button';
import { FormDatePicker } from '../../../shared/components';
import ReportsService from '../services/ReportsService';
import { formatCurrency } from '../../../shared/utils/formatting';
import { LoadingSpinner } from '../../../shared/components';
import { useToastController, useId } from '@fluentui/react-components';
import { ArrowDownload24Regular, Print24Regular } from '@fluentui/react-icons';

export default function IncomeStatementPage() {
  const toasterId = useId('toaster');
  const { dispatchToast } = useToastController(toasterId);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(
    new Date(new Date().getFullYear(), 0, 1),
  );
  const [dateTo, setDateTo] = useState<Date | undefined>(new Date());

  useEffect(() => {
    loadReport();
  }, [dateFrom, dateTo]);

  const loadReport = async () => {
    try {
      setLoading(true);
      const result = await ReportsService.getIncomeStatement(
        dateFrom?.toISOString().split('T')[0],
        dateTo?.toISOString().split('T')[0],
      );
      setData(result);
    } catch (error) {
      dispatchToast(<div>Failed to load income statement: {(error as Error).message}</div>, {
        intent: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      await ReportsService.exportToCSV([data], 'income-statement');
      dispatchToast(<div>Report exported successfully</div>, { intent: 'success' });
    } catch (error) {
      dispatchToast(<div>Failed to export report: {(error as Error).message}</div>, {
        intent: 'error',
      });
    }
  };

  if (loading) {
    return <LoadingSpinner variant="page" />;
  }

  if (!data) {
    return <div style={{ padding: '24px' }}>No data available</div>;
  }

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        <h1>Income Statement</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button variant="outline" icon={<ArrowDownload24Regular />} onClick={handleExport}>
            Export CSV
          </Button>
          <Button variant="outline" icon={<Print24Regular />} onClick={() => window.print()}>
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

      <div style={{ padding: '20px', border: '1px solid #e1e1e1', borderRadius: '8px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ padding: '12px', fontWeight: 600, borderBottom: '1px solid #e1e1e1' }}>
                Revenue
              </td>
              <td
                style={{
                  padding: '12px',
                  textAlign: 'right',
                  borderBottom: '1px solid #e1e1e1',
                  fontWeight: 600,
                }}
              >
                {formatCurrency(data.revenue)}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '12px', paddingLeft: '24px' }}>Cost of Goods Sold</td>
              <td style={{ padding: '12px', textAlign: 'right' }}>{formatCurrency(data.cogs)}</td>
            </tr>
            <tr>
              <td
                style={{
                  padding: '12px',
                  fontWeight: 600,
                  borderTop: '2px solid #e1e1e1',
                  borderBottom: '1px solid #e1e1e1',
                }}
              >
                Gross Profit
              </td>
              <td
                style={{
                  padding: '12px',
                  textAlign: 'right',
                  borderTop: '2px solid #e1e1e1',
                  borderBottom: '1px solid #e1e1e1',
                  fontWeight: 600,
                  color: '#107c10',
                }}
              >
                {formatCurrency(data.gross_profit)}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '12px', paddingLeft: '24px' }}>Operating Expenses</td>
              <td style={{ padding: '12px', textAlign: 'right' }}>
                {formatCurrency(data.expenses)}
              </td>
            </tr>
            <tr>
              <td
                style={{
                  padding: '12px',
                  fontWeight: 600,
                  borderTop: '2px solid #e1e1e1',
                  fontSize: '18px',
                }}
              >
                Net Income
              </td>
              <td
                style={{
                  padding: '12px',
                  textAlign: 'right',
                  borderTop: '2px solid #e1e1e1',
                  fontWeight: 600,
                  fontSize: '18px',
                  color: data.net_income >= 0 ? '#107c10' : '#d13438',
                }}
              >
                {formatCurrency(data.net_income)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
