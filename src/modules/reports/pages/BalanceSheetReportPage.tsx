import React, { useState, useEffect } from 'react';
import { Button } from '../../../renderer/components/ui/Button';
import { FormDatePicker } from '../../../shared/components';
import ReportsService from '../services/ReportsService';
import { formatCurrency } from '../../../shared/utils/formatting';
import { LoadingSpinner } from '../../../shared/components';
import { useToastController, useId } from '@fluentui/react-components';
import { ArrowDownload24Regular, Print24Regular } from '@fluentui/react-icons';

export default function BalanceSheetReportPage() {
  const toasterId = useId('toaster');
  const { dispatchToast } = useToastController(toasterId);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [asOfDate, setAsOfDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    loadReport();
  }, [asOfDate]);

  const loadReport = async () => {
    try {
      setLoading(true);
      const result = await ReportsService.getBalanceSheet(asOfDate?.toISOString().split('T')[0]);
      setData(result);
    } catch (error) {
      dispatchToast(<div>Failed to load balance sheet: {(error as Error).message}</div>, {
        intent: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      await ReportsService.exportToCSV([data], 'balance-sheet');
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
        <h1>Balance Sheet</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button variant="outline" icon={<ArrowDownload24Regular />} onClick={handleExport}>
            Export CSV
          </Button>
          <Button variant="outline" icon={<Print24Regular />} onClick={() => window.print()}>
            Print
          </Button>
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <FormDatePicker
          label="As of Date"
          name="as_of_date"
          value={asOfDate}
          onChange={setAsOfDate}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div style={{ padding: '20px', border: '1px solid #e1e1e1', borderRadius: '8px' }}>
          <h2 style={{ marginTop: 0 }}>Assets</h2>
          <div style={{ fontSize: '24px', fontWeight: 600, color: '#107c10', marginTop: '16px' }}>
            {formatCurrency(data.assets)}
          </div>
        </div>
        <div style={{ padding: '20px', border: '1px solid #e1e1e1', borderRadius: '8px' }}>
          <h2 style={{ marginTop: 0 }}>Liabilities</h2>
          <div style={{ fontSize: '24px', fontWeight: 600, color: '#616161', marginTop: '16px' }}>
            {formatCurrency(data.liabilities)}
          </div>
        </div>
        <div style={{ padding: '20px', border: '1px solid #e1e1e1', borderRadius: '8px' }}>
          <h2 style={{ marginTop: 0 }}>Equity</h2>
          <div style={{ fontSize: '24px', fontWeight: 600, color: '#107c10', marginTop: '16px' }}>
            {formatCurrency(data.equity)}
          </div>
        </div>
        <div style={{ padding: '20px', border: '1px solid #e1e1e1', borderRadius: '8px' }}>
          <h2 style={{ marginTop: 0 }}>Total</h2>
          <div style={{ fontSize: '24px', fontWeight: 600, marginTop: '16px' }}>
            {formatCurrency(data.total)}
          </div>
        </div>
      </div>
    </div>
  );
}
