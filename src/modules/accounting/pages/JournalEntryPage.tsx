import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../renderer/components/ui/Button';
import {
  FormInput,
  FormDatePicker,
  FormTextarea,
  FormCurrency,
  FormSelect,
  SearchableDropdown,
} from '../../../shared/components';
import AccountingService from '../services/AccountingService';
import type { ChartOfAccount } from '../../../shared/types/entities';
import { useToastController, useId } from '@fluentui/react-components';
import { Dismiss24Regular } from '@fluentui/react-icons';

interface JournalLine {
  account_id?: number;
  account_name?: string;
  description?: string;
  debit_amount: number;
  credit_amount: number;
}

export default function JournalEntryPage() {
  const navigate = useNavigate();
  const toasterId = useId('toaster');
  const { dispatchToast } = useToastController(toasterId);

  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [formData, setFormData] = useState({
    entry_date: new Date(),
    description: '',
  });
  const [lines, setLines] = useState<JournalLine[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadAccounts();
    addLine();
    addLine(); // Start with 2 lines
  }, []);

  const loadAccounts = async () => {
    try {
      const data = await AccountingService.getAccounts();
      setAccounts(data);
    } catch (error) {
      console.error('Failed to load accounts:', error);
    }
  };

  const addLine = () => {
    setLines([...lines, { debit_amount: 0, credit_amount: 0 }]);
  };

  const removeLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const updateLine = (index: number, field: keyof JournalLine, value: any) => {
    const updated = [...lines];
    updated[index] = { ...updated[index], [field]: value };

    // Clear the opposite amount when one is entered
    if (field === 'debit_amount' && value > 0) {
      updated[index].credit_amount = 0;
    }
    if (field === 'credit_amount' && value > 0) {
      updated[index].debit_amount = 0;
    }

    setLines(updated);
  };

  const selectAccount = (index: number, account: ChartOfAccount) => {
    const updated = [...lines];
    updated[index] = {
      ...updated[index],
      account_id: account.id,
      account_name: account.account_name,
    };
    setLines(updated);
  };

  const totalDebit = lines.reduce((sum, line) => sum + line.debit_amount, 0);
  const totalCredit = lines.reduce((sum, line) => sum + line.credit_amount, 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.description?.trim()) {
      newErrors.description = 'Description is required';
    }

    if (lines.length < 2) {
      newErrors.lines = 'At least 2 lines are required';
    }

    if (!isBalanced) {
      newErrors.balance = `Debits (${totalDebit.toFixed(2)}) must equal Credits (${totalCredit.toFixed(2)})`;
    }

    lines.forEach((line, index) => {
      if (!line.account_id) {
        newErrors[`line_${index}_account`] = 'Account is required';
      }
      if (line.debit_amount === 0 && line.credit_amount === 0) {
        newErrors[`line_${index}_amount`] = 'Either debit or credit amount is required';
      }
      if (line.debit_amount > 0 && line.credit_amount > 0) {
        newErrors[`line_${index}_both`] = 'Cannot have both debit and credit amounts';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      dispatchToast(<div>Please fix the errors in the form</div>, { intent: 'error' });
      return;
    }

    try {
      setLoading(true);

      await AccountingService.createJournalEntry({
        entry_date: formData.entry_date.toISOString().split('T')[0],
        description: formData.description,
        lines: lines
          .filter((line) => line.account_id)
          .map((line) => ({
            account_id: line.account_id!,
            description: line.description,
            debit_amount: line.debit_amount,
            credit_amount: line.credit_amount,
          })),
      });

      dispatchToast(<div>Journal entry created successfully</div>, { intent: 'success' });
      navigate('/accounting/journal-entries');
    } catch (error) {
      dispatchToast(<div>Failed to save journal entry: {(error as Error).message}</div>, {
        intent: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1>New Journal Entry</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <FormDatePicker
            label="Entry Date"
            name="entry_date"
            value={formData.entry_date}
            onChange={(value) => setFormData({ ...formData, entry_date: value || new Date() })}
            required
          />
          <FormInput
            label="Description"
            name="description"
            value={formData.description}
            onChange={(value) => setFormData({ ...formData, description: value })}
            required
            error={errors.description}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}
          >
            <h2>Entry Lines</h2>
            <Button type="button" variant="outline" onClick={addLine}>
              Add Line
            </Button>
          </div>
          {errors.balance && (
            <div style={{ color: '#d13438', marginBottom: '8px', fontWeight: 600 }}>
              {errors.balance}
            </div>
          )}
          <table className="invoice-items-table">
            <thead>
              <tr>
                <th>Account</th>
                <th>Description</th>
                <th>Debit</th>
                <th>Credit</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, index) => (
                <tr key={index}>
                  <td>
                    <SearchableDropdown
                      label=""
                      name={`account_${index}`}
                      value={line.account_id}
                      onChange={(value) =>
                        selectAccount(
                          index,
                          accounts.find((a) => a.id === value)! as ChartOfAccount,
                        )
                      }
                      options={accounts.map((a) => ({
                        value: a.id,
                        label: `${a.account_code} - ${a.account_name}`,
                      }))}
                      placeholder="Select account"
                    />
                  </td>
                  <td>
                    <FormInput
                      label=""
                      name={`desc_${index}`}
                      value={line.description || ''}
                      onChange={(value) => updateLine(index, 'description', value)}
                    />
                  </td>
                  <td>
                    <FormCurrency
                      label=""
                      name={`debit_${index}`}
                      value={line.debit_amount}
                      onChange={(value) => updateLine(index, 'debit_amount', value || 0)}
                      min={0}
                    />
                  </td>
                  <td>
                    <FormCurrency
                      label=""
                      name={`credit_${index}`}
                      value={line.credit_amount}
                      onChange={(value) => updateLine(index, 'credit_amount', value || 0)}
                      min={0}
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => removeLine(index)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                      }}
                    >
                      <Dismiss24Regular />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ fontWeight: 600, borderTop: '2px solid #e1e1e1' }}>
                <td colSpan={2} style={{ textAlign: 'right' }}>
                  Totals:
                </td>
                <td style={{ color: isBalanced ? '#107c10' : '#d13438' }}>
                  {totalDebit.toFixed(2)}
                </td>
                <td style={{ color: isBalanced ? '#107c10' : '#d13438' }}>
                  {totalCredit.toFixed(2)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div
          style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}
        >
          <Button variant="outline" onClick={() => navigate('/accounting')} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading} disabled={!isBalanced}>
            Post Journal Entry
          </Button>
        </div>
      </form>
    </div>
  );
}
