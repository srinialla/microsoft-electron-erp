import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../renderer/components/ui/Button';
import {
  FormDatePicker,
  FormCurrency,
  FormSelect,
  FormTextarea,
  SearchableDropdown,
} from '../../../shared/components';
import SalesService from '../services/SalesService';
import CustomerService from '../../customers/services/CustomerService';
import { formatCurrency, formatDate } from '../../../shared/utils/formatting';
import { useToastController, useId } from '@fluentui/react-components';
import { LoadingSpinner } from '../../../shared/components';

export default function PaymentFormPage() {
  const navigate = useNavigate();
  const toasterId = useId('toaster');
  const { dispatchToast } = useToastController(toasterId);

  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    customer_id: undefined as number | undefined,
    payment_date: new Date(),
    payment_method: 'cash' as string,
    reference_number: '',
    amount: 0,
    notes: '',
    allocated_invoices: [] as number[],
  });

  useEffect(() => {
    loadOptions();
  }, []);

  useEffect(() => {
    if (formData.customer_id) {
      loadCustomerInvoices(formData.customer_id);
    }
  }, [formData.customer_id]);

  const loadOptions = async () => {
    try {
      const custs = await CustomerService.getCustomers();
      setCustomers(custs);
    } catch (error) {
      console.error('Failed to load options:', error);
    }
  };

  const loadCustomerInvoices = async (customerId: number) => {
    try {
      const invs = await SalesService.getInvoices({
        customer_id: customerId,
        status: 'unpaid',
      });
      setInvoices(invs.filter((inv) => (inv.balance_amount || inv.grand_total) > 0));
    } catch (error) {
      console.error('Failed to load invoices:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customer_id) {
      dispatchToast(<div>Please select a customer</div>, { intent: 'error' });
      return;
    }

    if (formData.amount <= 0) {
      dispatchToast(<div>Payment amount must be greater than 0</div>, { intent: 'error' });
      return;
    }

    try {
      setLoading(true);
      dispatchToast(<div>Payment recording not yet implemented in service</div>, {
        intent: 'warning',
      });
      // TODO: Implement recordPayment when service method is available
      // navigate('/sales/payments/list');
    } catch (error) {
      dispatchToast(<div>Failed to record payment: {(error as Error).message}</div>, {
        intent: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const totalOutstanding = invoices.reduce(
    (sum, inv) => sum + (inv.balance_amount || inv.grand_total - (inv.paid_amount || 0)),
    0,
  );

  if (loading) {
    return <LoadingSpinner variant="page" />;
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1>Record Payment</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          <div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                marginBottom: '24px',
              }}
            >
              <SearchableDropdown
                label="Customer"
                name="customer_id"
                value={formData.customer_id}
                onChange={(value) =>
                  setFormData({ ...formData, customer_id: value as number | undefined })
                }
                options={customers.map((c) => ({ value: c.id, label: c.display_name }))}
                required
              />
              <FormDatePicker
                label="Payment Date"
                name="payment_date"
                value={formData.payment_date}
                onChange={(value) =>
                  setFormData({ ...formData, payment_date: value || new Date() })
                }
                required
              />
              <FormSelect
                label="Payment Method"
                name="payment_method"
                value={formData.payment_method}
                onChange={(value) => setFormData({ ...formData, payment_method: value as string })}
                options={[
                  { value: 'cash', label: 'Cash' },
                  { value: 'check', label: 'Check' },
                  { value: 'bank_transfer', label: 'Bank Transfer' },
                  { value: 'card', label: 'Card' },
                  { value: 'online', label: 'Online Payment' },
                ]}
                required
              />
              <FormCurrency
                label="Amount"
                name="amount"
                value={formData.amount}
                onChange={(value) => setFormData({ ...formData, amount: value || 0 })}
                required
                min={0.01}
              />
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>
                  Reference Number
                </label>
                <input
                  type="text"
                  value={formData.reference_number}
                  onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #e1e1e1',
                    borderRadius: '4px',
                  }}
                  placeholder="Check number, transaction ID, etc."
                />
              </div>
              <FormTextarea
                label="Notes"
                name="notes"
                value={formData.notes}
                onChange={(value) => setFormData({ ...formData, notes: value })}
                rows={3}
              />
            </div>

            {formData.customer_id && invoices.length > 0 && (
              <div style={{ marginTop: '24px' }}>
                <h3>Outstanding Invoices</h3>
                <div
                  style={{ border: '1px solid #e1e1e1', borderRadius: '4px', overflow: 'hidden' }}
                >
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f5f5f5' }}>
                      <tr>
                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px' }}>
                          Invoice
                        </th>
                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px' }}>
                          Date
                        </th>
                        <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px' }}>
                          Total
                        </th>
                        <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px' }}>
                          Paid
                        </th>
                        <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px' }}>
                          Balance
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((inv) => (
                        <tr key={inv.id} style={{ borderTop: '1px solid #f5f5f5' }}>
                          <td style={{ padding: '12px' }}>{inv.invoice_number}</td>
                          <td style={{ padding: '12px' }}>{formatDate(inv.invoice_date)}</td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>
                            {formatCurrency(inv.grand_total)}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>
                            {formatCurrency(inv.paid_amount || 0)}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right', fontWeight: 500 }}>
                            {formatCurrency(
                              inv.balance_amount || inv.grand_total - (inv.paid_amount || 0),
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <div>
            <div
              style={{
                padding: '20px',
                border: '1px solid #e1e1e1',
                borderRadius: '8px',
                position: 'sticky',
                top: '20px',
              }}
            >
              <h2 style={{ marginTop: 0 }}>Summary</h2>
              {formData.customer_id && (
                <div style={{ display: 'grid', gap: '12px', marginTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Total Outstanding:</span>
                    <strong>{formatCurrency(totalOutstanding)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Payment Amount:</span>
                    <strong>{formatCurrency(formData.amount)}</strong>
                  </div>
                  {formData.amount > totalOutstanding && (
                    <div style={{ color: '#d13438', fontSize: '12px', marginTop: '8px' }}>
                      Payment exceeds outstanding amount
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div
          style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}
        >
          <Button
            variant="outline"
            onClick={() => navigate('/sales/payments/list')}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            Record Payment
          </Button>
        </div>
      </form>
    </div>
  );
}
