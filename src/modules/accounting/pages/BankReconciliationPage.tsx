import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../renderer/components/ui/Button';
import { FormSelect, FormDatePicker, DataGrid, LoadingSpinner } from '../../../shared/components';
import AccountingService from '../services/AccountingService';
import type { BankAccount, BankTransaction } from '../../../shared/types/entities';
import { formatCurrency, formatDate } from '../../../shared/utils/formatting';
import { useToastController, useId } from '@fluentui/react-components';
import { getDatabaseService } from '../../../services/database/DatabaseFactory';
import { Checkmark24Regular } from '@fluentui/react-icons';

export default function BankReconciliationPage() {
  const navigate = useNavigate();
  const toasterId = useId('toaster');
  const { dispatchToast } = useToastController(toasterId);

  const [loading, setLoading] = useState(false);
  const [loadingBankAccounts, setLoadingBankAccounts] = useState(true);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [selectedBankAccount, setSelectedBankAccount] = useState<number | undefined>();
  const [reconciliationDate, setReconciliationDate] = useState<Date | undefined>(new Date());
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);

  useEffect(() => {
    loadBankAccounts();
  }, []);

  useEffect(() => {
    if (selectedBankAccount && reconciliationDate) {
      loadTransactions();
    }
  }, [selectedBankAccount, reconciliationDate]);

  const loadBankAccounts = async () => {
    try {
      setLoadingBankAccounts(true);
      const accounts = await AccountingService.getBankAccounts();
      setBankAccounts(accounts);
      if (accounts.length > 0) {
        setSelectedBankAccount(accounts[0].id);
      }
    } catch (error) {
      dispatchToast(<div>Failed to load bank accounts: {(error as Error).message}</div>, {
        intent: 'error',
      });
    } finally {
      setLoadingBankAccounts(false);
    }
  };

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const db = getDatabaseService();
      const allTransactions = await db.findAll<BankTransaction>('bank_transactions');

      const filtered = allTransactions
        .filter(
          (t) =>
            t.bank_account_id === selectedBankAccount &&
            new Date(t.transaction_date) <= (reconciliationDate || new Date()),
        )
        .sort(
          (a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime(),
        );

      setTransactions(filtered);
    } catch (error) {
      dispatchToast(<div>Failed to load transactions: {(error as Error).message}</div>, {
        intent: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReconcile = async (transactionId: number) => {
    try {
      const db = getDatabaseService();
      await db.update('bank_transactions', transactionId, {
        is_reconciled: true,
        reconciled_date: reconciliationDate?.toISOString().split('T')[0],
      });

      dispatchToast(<div>Transaction reconciled successfully</div>, { intent: 'success' });
      loadTransactions();
    } catch (error) {
      dispatchToast(<div>Failed to reconcile transaction: {(error as Error).message}</div>, {
        intent: 'error',
      });
    }
  };

  const columns = [
    {
      key: 'transaction_date',
      header: 'Date',
      sortable: true,
      render: (value: string) => formatDate(value),
    },
    {
      key: 'transaction_type',
      header: 'Type',
      sortable: true,
      render: (value: string) => <span style={{ textTransform: 'capitalize' }}>{value}</span>,
    },
    {
      key: 'amount',
      header: 'Amount',
      sortable: true,
      align: 'right' as const,
      render: (value: number, row: BankTransaction) => (
        <span
          style={{
            color: row.transaction_type === 'deposit' ? '#107c10' : '#d13438',
            fontWeight: 600,
          }}
        >
          {row.transaction_type === 'deposit' ? '+' : '-'}
          {formatCurrency(value)}
        </span>
      ),
    },
    {
      key: 'reference_number',
      header: 'Reference',
      sortable: true,
    },
    {
      key: 'description',
      header: 'Description',
      sortable: true,
    },
    {
      key: 'is_reconciled',
      header: 'Status',
      sortable: true,
      render: (value: boolean) => (
        <span
          style={{
            padding: '4px 8px',
            borderRadius: '4px',
            background: value ? '#d4edda' : '#fff3cd',
            color: value ? '#155724' : '#856404',
            fontSize: '12px',
          }}
        >
          {value ? 'Reconciled' : 'Pending'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_: any, row: BankTransaction) => (
        <Button
          size="small"
          variant="primary"
          onClick={() => handleReconcile(row.id)}
          disabled={row.is_reconciled}
          icon={<Checkmark24Regular />}
        >
          Reconcile
        </Button>
      ),
    },
  ];

  const unreconciledTotal = transactions
    .filter((t) => !t.is_reconciled)
    .reduce((sum, t) => {
      return sum + (t.transaction_type === 'deposit' ? t.amount : -t.amount);
    }, 0);

  const selectedBank = bankAccounts.find((b) => b.id === selectedBankAccount);

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
        <h1>Bank Reconciliation</h1>
        <Button variant="outline" onClick={() => navigate('/accounting')}>
          Back
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
        <FormSelect
          label="Bank Account"
          name="bank_account"
          value={selectedBankAccount?.toString()}
          onChange={(value) => setSelectedBankAccount(parseInt(value))}
          options={bankAccounts.map((b) => ({
            value: b.id.toString(),
            label: `${b.account_name} - ${b.account_number}`,
          }))}
          disabled={loadingBankAccounts}
        />
        <FormDatePicker
          label="Reconciliation Date"
          name="reconciliation_date"
          value={reconciliationDate}
          onChange={setReconciliationDate}
        />
      </div>

      {selectedBank && (
        <div
          style={{
            background: '#f5f5f5',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '14px', color: '#616161' }}>Current Balance</div>
              <div style={{ fontSize: '20px', fontWeight: 600 }}>
                {formatCurrency(selectedBank.current_balance || 0)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '14px', color: '#616161' }}>Unreconciled Amount</div>
              <div
                style={{
                  fontSize: '20px',
                  fontWeight: 600,
                  color: unreconciledTotal !== 0 ? '#d13438' : '#107c10',
                }}
              >
                {formatCurrency(unreconciledTotal)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '14px', color: '#616161' }}>Unreconciled Transactions</div>
              <div style={{ fontSize: '20px', fontWeight: 600 }}>
                {transactions.filter((t) => !t.is_reconciled).length}
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <LoadingSpinner variant="page" />
      ) : (
        <DataGrid columns={columns} data={transactions} searchable />
      )}
    </div>
  );
}
