import React, { useState, useEffect } from 'react';
import { Button } from '../../../renderer/components/ui/Button';
import { FormDatePicker } from '../../../shared/components';
import { formatCurrency } from '../../../shared/utils/formatting';
import { LoadingSpinner } from '../../../shared/components';
import { useToastController, useId } from '@fluentui/react-components';
import { ArrowDownload24Regular, Print24Regular } from '@fluentui/react-icons';

export default function CashFlowPage() {
  const toasterId = useId('toaster');
  const { dispatchToast } = useToastController(toasterId);

  const [loading, setLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(
    new Date(new Date().getFullYear(), 0, 1),
  );
  const [dateTo, setDateTo] = useState<Date | undefined>(new Date());

  // Simplified cash flow - in production would calculate from journal entries
  const cashFlowData = {
    operating_activities: 0,
    investing_activities: 0,
    financing_activities: 0,
    net_change: 0,
    opening_balance: 0,
    closing_balance: 0,
  };

  const handleExport = async () => {
    try {
      // Export functionality would go here
      dispatchToast(<div>Report exported successfully</div>, { intent: 'success' });
    } catch (error) {
      dispatchToast(<div>Failed to export report: {(error as Error).message}</div>, {
        intent: 'error',
      });
    }
  };

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
        <h1>Cash Flow Statement</h1>
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

      {loading ? (
        <LoadingSpinner variant="page" />
      ) : (
        <div style={{ padding: '20px', border: '1px solid #e1e1e1', borderRadius: '8px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ padding: '12px', fontWeight: 600 }}>Operating Activities</td>
                <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>
                  {formatCurrency(cashFlowData.operating_activities)}
                </td>
              </tr>
              <tr>
                <td style={{ padding: '12px', fontWeight: 600 }}>Investing Activities</td>
                <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>
                  {formatCurrency(cashFlowData.investing_activities)}
                </td>
              </tr>
              <tr>
                <td style={{ padding: '12px', fontWeight: 600 }}>Financing Activities</td>
                <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>
                  {formatCurrency(cashFlowData.financing_activities)}
                </td>
              </tr>
              <tr style={{ borderTop: '2px solid #e1e1e1' }}>
                <td style={{ padding: '12px', fontWeight: 600, fontSize: '18px' }}>Net Change</td>
                <td
                  style={{
                    padding: '12px',
                    textAlign: 'right',
                    fontWeight: 600,
                    fontSize: '18px',
                    color: cashFlowData.net_change >= 0 ? '#107c10' : '#d13438',
                  }}
                >
                  {formatCurrency(cashFlowData.net_change)}
                </td>
              </tr>
              <tr>
                <td style={{ padding: '12px', fontWeight: 600 }}>Opening Balance</td>
                <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>
                  {formatCurrency(cashFlowData.opening_balance)}
                </td>
              </tr>
              <tr style={{ borderTop: '2px solid #e1e1e1' }}>
                <td style={{ padding: '12px', fontWeight: 600, fontSize: '18px' }}>
                  Closing Balance
                </td>
                <td
                  style={{
                    padding: '12px',
                    textAlign: 'right',
                    fontWeight: 600,
                    fontSize: '18px',
                    color: '#107c10',
                  }}
                >
                  {formatCurrency(cashFlowData.closing_balance)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
