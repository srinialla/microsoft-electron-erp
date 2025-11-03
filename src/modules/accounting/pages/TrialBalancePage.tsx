import React, { useState, useEffect } from 'react';
import { DataGrid } from '../../../shared/components';
import AccountingService from '../services/AccountingService';
import { formatCurrency } from '../../../shared/utils/formatting';
import { FormDatePicker } from '../../../shared/components';
import { LoadingSpinner } from '../../../shared/components';
import { useToastController, useId } from '@fluentui/react-components';

export default function TrialBalancePage() {
  const toasterId = useId('toaster');
  const { dispatchToast } = useToastController(toasterId);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<
    Array<{
      account_id: number;
      account_name: string;
      account_code: string;
      debit: number;
      credit: number;
    }>
  >([]);
  const [asOfDate, setAsOfDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    loadTrialBalance();
  }, [asOfDate]);

  const loadTrialBalance = async () => {
    try {
      setLoading(true);
      const result = await AccountingService.getTrialBalance(asOfDate?.toISOString().split('T')[0]);
      setData(result);
    } catch (error) {
      dispatchToast(<div>Failed to load trial balance: {(error as Error).message}</div>, {
        intent: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      key: 'account_code',
      header: 'Account Code',
      sortable: true,
      width: '150px',
    },
    {
      key: 'account_name',
      header: 'Account Name',
      sortable: true,
    },
    {
      key: 'debit',
      header: 'Debit',
      sortable: true,
      align: 'right' as const,
      render: (value: number) => (value > 0 ? formatCurrency(value) : '-'),
    },
    {
      key: 'credit',
      header: 'Credit',
      sortable: true,
      align: 'right' as const,
      render: (value: number) => (value > 0 ? formatCurrency(value) : '-'),
    },
  ];

  const totalDebit = data.reduce((sum, row) => sum + row.debit, 0);
  const totalCredit = data.reduce((sum, row) => sum + row.credit, 0);

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
        <h1>Trial Balance</h1>
        <FormDatePicker
          label="As of Date"
          name="as_of_date"
          value={asOfDate}
          onChange={setAsOfDate}
        />
      </div>

      {loading ? (
        <LoadingSpinner variant="page" />
      ) : (
        <>
          <DataGrid columns={columns} data={data} searchable exportable />
          <div
            style={{
              marginTop: '24px',
              padding: '20px',
              backgroundColor: '#f5f5f5',
              borderRadius: '8px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '18px',
                fontWeight: 600,
              }}
            >
              <span>Total Debit:</span>
              <span>{formatCurrency(totalDebit)}</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '18px',
                fontWeight: 600,
                marginTop: '8px',
              }}
            >
              <span>Total Credit:</span>
              <span>{formatCurrency(totalCredit)}</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '18px',
                fontWeight: 600,
                marginTop: '8px',
                color: Math.abs(totalDebit - totalCredit) < 0.01 ? '#107c10' : '#d13438',
              }}
            >
              <span>Difference:</span>
              <span>{formatCurrency(Math.abs(totalDebit - totalCredit))}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
