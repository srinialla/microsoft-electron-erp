import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../renderer/components/ui/Button';
import {
  FormInput,
  FormDatePicker,
  FormCurrency,
  FormTextarea,
  SearchableDropdown,
} from '../../../shared/components';
import AccountingService from '../services/AccountingService';
import type { BankAccount, ChartOfAccount } from '../../../shared/types/entities';
import { useToastController, useId } from '@fluentui/react-components';
import { generateDocumentNumber } from '../../../shared/utils/numberGenerator';
import { getDatabaseService } from '../../../services/database/DatabaseFactory';

export default function ReceiptPage() {
  const navigate = useNavigate();
  const toasterId = useId('toaster');
  const { dispatchToast } = useToastController(toasterId);

  const [loading, setLoading] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [formData, setFormData] = useState({
    bank_account_id: undefined as number | undefined,
    receipt_date: new Date(),
    amount: 0,
    account_id: undefined as number | undefined,
    received_from: '',
    reference_number: '',
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [banks, accs] = await Promise.all([
        AccountingService.getBankAccounts(),
        AccountingService.getAccounts(),
      ]);
      setBankAccounts(banks);
      setAccounts(accs);
    } catch (error) {
      dispatchToast(<div>Failed to load data: {(error as Error).message}</div>, {
        intent: 'error',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors: Record<string, string> = {};
    if (!formData.bank_account_id) {
      validationErrors.bank_account_id = 'Bank account is required';
    }
    if (formData.amount <= 0) {
      validationErrors.amount = 'Amount must be greater than 0';
    }
    if (!formData.account_id) {
      validationErrors.account_id = 'Account is required';
    }
    if (!formData.received_from) {
      validationErrors.received_from = 'Received from is required';
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setLoading(true);
      const db = getDatabaseService();
      const receiptNumber = await generateDocumentNumber('RCP', 'receipts', 'receipt_number', db);

      // Create journal entry
      await AccountingService.createJournalEntry({
        entry_date: formData.receipt_date.toISOString().split('T')[0],
        description:
          formData.description ||
          `Receipt from ${formData.received_from} - ${formData.reference_number}`,
        lines: [
          {
            account_id: formData.bank_account_id!,
            description: `Receipt from ${formData.received_from}`,
            debit_amount: formData.amount,
            credit_amount: 0,
          },
          {
            account_id: formData.account_id!,
            description: `Receipt from ${formData.received_from}`,
            debit_amount: 0,
            credit_amount: formData.amount,
          },
        ],
      });

      // Update bank account balance
      const bankAccount = bankAccounts?.find((b) => b.id === formData.bank_account_id);
      if (bankAccount) {
        await AccountingService.updateBankAccount(formData.bank_account_id, {
          current_balance: (bankAccount.current_balance || 0) + formData.amount,
        });
      }

      dispatchToast(<div>Receipt recorded successfully</div>, { intent: 'success' });
      navigate('/accounting');
    } catch (error) {
      dispatchToast(<div>Failed to record receipt: {(error as Error).message}</div>, {
        intent: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1>Record Receipt</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gap: '16px', marginBottom: '24px' }}>
          <FormInput
            label="Received From"
            name="received_from"
            value={formData.received_from}
            onChange={(value) => setFormData({ ...formData, received_from: value })}
            required
            error={errors.received_from}
            placeholder="Customer, vendor, or person name"
          />

          <SearchableDropdown
            label="Bank Account"
            placeholder="Select bank account..."
            value={bankAccounts?.find((b) => b.id === formData.bank_account_id) || null}
            onChange={(bank) => setFormData({ ...formData, bank_account_id: bank?.id })}
            getItems={async (search) => {
              const filtered = (bankAccounts || []).filter(
                (b) =>
                  b.account_name?.toLowerCase().includes(search.toLowerCase()) ||
                  b.account_number?.includes(search),
              );
              return filtered.map((b) => ({
                value: b.id,
                label: `${b.account_name} - ${b.account_number}`,
                data: b,
              }));
            }}
            required
            error={errors.bank_account_id}
          />

          <FormDatePicker
            label="Receipt Date"
            name="receipt_date"
            value={formData.receipt_date}
            onChange={(value) => setFormData({ ...formData, receipt_date: value || new Date() })}
            required
          />

          <FormCurrency
            label="Amount"
            name="amount"
            value={formData.amount}
            onChange={(value) => setFormData({ ...formData, amount: value || 0 })}
            required
            error={errors.amount}
          />

          <SearchableDropdown
            label="Income Account"
            placeholder="Select account..."
            value={accounts?.find((a) => a.id === formData.account_id) || null}
            onChange={(account) => setFormData({ ...formData, account_id: account?.id })}
            getItems={async (search) => {
              const filtered = (accounts || []).filter(
                (a) =>
                  a.account_name?.toLowerCase().includes(search.toLowerCase()) ||
                  a.account_code?.includes(search),
              );
              return filtered.map((a) => ({
                value: a.id,
                label: `${a.account_code} - ${a.account_name}`,
                data: a,
              }));
            }}
            required
            error={errors.account_id}
          />

          <FormInput
            label="Reference Number"
            name="reference_number"
            value={formData.reference_number}
            onChange={(value) => setFormData({ ...formData, reference_number: value })}
            placeholder="Invoice number, check number, etc."
          />

          <FormTextarea
            label="Description"
            name="description"
            value={formData.description}
            onChange={(value) => setFormData({ ...formData, description: value })}
            rows={3}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <Button variant="outline" onClick={() => navigate('/accounting')} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            Record Receipt
          </Button>
        </div>
      </form>
    </div>
  );
}
