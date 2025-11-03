import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../renderer/components/ui/Button';
import {
  FormTextarea,
  FormDatePicker,
  FormCurrency,
  FormNumberInput,
  FormSelect,
  SearchableDropdown,
} from '../../../shared/components';
import SalesService from '../services/SalesService';
import ProductService from '../../inventory/services/ProductService';
import CustomerService from '../../customers/services/CustomerService';
import { formatCurrency } from '../../../shared/utils/formatting';
import { useToastController, useId } from '@fluentui/react-components';
import { LoadingSpinner } from '../../../shared/components';
import './InvoiceFormPage.css';

export default function SalesReturnFormPage() {
  const navigate = useNavigate();
  const toasterId = useId('toaster');
  const { dispatchToast } = useToastController(toasterId);

  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [formData, setFormData] = useState({
    invoice_id: undefined as number | undefined,
    customer_id: undefined as number | undefined,
    return_date: new Date(),
    reason: '',
    return_type: 'full' as 'full' | 'partial',
    refund_method: 'credit' as 'credit' | 'cash' | 'refund',
    notes: '',
  });

  useEffect(() => {
    loadOptions();
  }, []);

  const loadOptions = async () => {
    try {
      const custs = await CustomerService.getCustomers();
      setCustomers(custs);
      const invs = await SalesService.getInvoices({ status: 'paid' });
      setInvoices(invs);
    } catch (error) {
      console.error('Failed to load options:', error);
    }
  };

  const handleInvoiceSelect = (invoiceId: number) => {
    const invoice = invoices.find((inv) => inv.id === invoiceId);
    if (invoice) {
      setSelectedInvoice(invoice);
      setFormData({ ...formData, invoice_id: invoiceId, customer_id: invoice.customer_id });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.invoice_id || !formData.customer_id) {
      dispatchToast(<div>Please select an invoice</div>, { intent: 'error' });
      return;
    }

    try {
      setLoading(true);
      dispatchToast(<div>Sales return creation not yet implemented in service</div>, {
        intent: 'warning',
      });
      // TODO: Implement createReturn when service method is available
    } catch (error) {
      dispatchToast(<div>Failed to create return: {(error as Error).message}</div>, {
        intent: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner variant="page" />;
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1>New Sales Return</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gap: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <SearchableDropdown
              label="Invoice"
              name="invoice_id"
              value={formData.invoice_id}
              onChange={(value) => handleInvoiceSelect(value as number)}
              options={invoices.map((inv) => ({
                value: inv.id,
                label: `${inv.invoice_number} - ${formatCurrency(inv.grand_total)}`,
              }))}
              required
              placeholder="Select invoice to return"
            />
            <FormDatePicker
              label="Return Date"
              name="return_date"
              value={formData.return_date}
              onChange={(value) => setFormData({ ...formData, return_date: value || new Date() })}
              required
            />
            {selectedInvoice && (
              <>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>
                    Customer
                  </label>
                  <div
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #e1e1e1',
                      borderRadius: '4px',
                    }}
                  >
                    {customers.find((c) => c.id === selectedInvoice.customer_id)?.display_name ||
                      'Unknown'}
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>
                    Invoice Total
                  </label>
                  <div
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #e1e1e1',
                      borderRadius: '4px',
                    }}
                  >
                    {formatCurrency(selectedInvoice.grand_total)}
                  </div>
                </div>
              </>
            )}
            <FormSelect
              label="Return Type"
              name="return_type"
              value={formData.return_type}
              onChange={(value) =>
                setFormData({ ...formData, return_type: value as 'full' | 'partial' })
              }
              options={[
                { value: 'full', label: 'Full Return' },
                { value: 'partial', label: 'Partial Return' },
              ]}
              required
            />
            <FormSelect
              label="Refund Method"
              name="refund_method"
              value={formData.refund_method}
              onChange={(value) =>
                setFormData({ ...formData, refund_method: value as 'credit' | 'cash' | 'refund' })
              }
              options={[
                { value: 'credit', label: 'Credit Note' },
                { value: 'cash', label: 'Cash Refund' },
                { value: 'refund', label: 'Bank Refund' },
              ]}
              required
            />
            <FormTextarea
              label="Reason for Return"
              name="reason"
              value={formData.reason}
              onChange={(value) => setFormData({ ...formData, reason: value })}
              rows={3}
              required
            />
            <FormTextarea
              label="Notes"
              name="notes"
              value={formData.notes}
              onChange={(value) => setFormData({ ...formData, notes: value })}
              rows={3}
            />
          </div>

          <div
            style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}
          >
            <Button
              variant="outline"
              onClick={() => navigate('/sales/return/list')}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={loading}>
              Create Return
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
