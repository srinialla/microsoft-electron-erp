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
import PurchasesService from '../services/PurchasesService';
import { formatCurrency, formatDate } from '../../../shared/utils/formatting';
import { useToastController, useId } from '@fluentui/react-components';
import { LoadingSpinner } from '../../../shared/components';

export default function PurchaseReturnFormPage() {
  const navigate = useNavigate();
  const toasterId = useId('toaster');
  const { dispatchToast } = useToastController(toasterId);

  const [loading, setLoading] = useState(false);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [selectedPO, setSelectedPO] = useState<any>(null);
  const [formData, setFormData] = useState({
    po_id: undefined as number | undefined,
    return_date: new Date(),
    reason: '',
    refund_method: 'credit' as 'credit' | 'cash' | 'refund',
    notes: '',
  });

  useEffect(() => {
    loadPurchaseOrders();
  }, []);

  const loadPurchaseOrders = async () => {
    try {
      const orders = await PurchasesService.getPurchaseOrders({ status: 'fully_received' });
      setPurchaseOrders(orders);
    } catch (error) {
      console.error('Failed to load purchase orders:', error);
    }
  };

  const handlePOSelect = (poId: number) => {
    const po = purchaseOrders.find((o) => o.id === poId);
    if (po) {
      setSelectedPO(po);
      setFormData({ ...formData, po_id: poId });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.po_id) {
      dispatchToast(<div>Please select a purchase order</div>, { intent: 'error' });
      return;
    }

    if (!formData.reason.trim()) {
      dispatchToast(<div>Please provide a reason for return</div>, { intent: 'error' });
      return;
    }

    try {
      setLoading(true);
      dispatchToast(<div>Purchase return creation not yet implemented in service</div>, {
        intent: 'warning',
      });
      // TODO: Implement createPurchaseReturn when service method is available
      // navigate('/purchases/return/list');
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
        <h1>New Purchase Return</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gap: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <SearchableDropdown
              label="Purchase Order"
              name="po_id"
              value={formData.po_id}
              onChange={(value) => handlePOSelect(value as number)}
              options={purchaseOrders.map((po) => ({
                value: po.id,
                label: `${po.po_number} - ${formatCurrency(po.grand_total)}`,
              }))}
              required
              placeholder="Select purchase order to return"
            />
            <FormDatePicker
              label="Return Date"
              name="return_date"
              value={formData.return_date}
              onChange={(value) => setFormData({ ...formData, return_date: value || new Date() })}
              required
            />
            {selectedPO && (
              <>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>
                    Vendor
                  </label>
                  <div style={{ padding: '8px 12px', border: '1px solid #e1e1e1', borderRadius: '4px' }}>
                    Vendor {selectedPO.vendor_id}
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>
                    PO Total
                  </label>
                  <div style={{ padding: '8px 12px', border: '1px solid #e1e1e1', borderRadius: '4px' }}>
                    {formatCurrency(selectedPO.grand_total)}
                  </div>
                </div>
              </>
            )}
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
            <div style={{ gridColumn: '1 / -1' }}>
              <FormTextarea
                label="Reason for Return"
                name="reason"
                value={formData.reason}
                onChange={(value) => setFormData({ ...formData, reason: value })}
                rows={3}
                required
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <FormTextarea
                label="Notes"
                name="notes"
                value={formData.notes}
                onChange={(value) => setFormData({ ...formData, notes: value })}
                rows={3}
              />
            </div>
          </div>

          <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <Button variant="outline" onClick={() => navigate('/purchases/return/list')} disabled={loading}>
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
