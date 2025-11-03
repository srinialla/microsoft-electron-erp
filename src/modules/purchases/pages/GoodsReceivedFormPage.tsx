import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../../../renderer/components/ui/Button';
import {
  FormDatePicker,
  FormNumberInput,
  FormTextarea,
  FormInput,
  SearchableDropdown,
} from '../../../shared/components';
import PurchasesService from '../services/PurchasesService';
import { formatCurrency, formatDate } from '../../../shared/utils/formatting';
import { useToastController, useId } from '@fluentui/react-components';
import { LoadingSpinner } from '../../../shared/components';
// Using inline styles instead of importing CSS

interface GRNLineItem {
  po_item_id: number;
  product_id: number;
  product_name: string;
  ordered_quantity: number;
  received_quantity: number;
  accepted_quantity: number;
  rejected_quantity: number;
  rejection_reason: string;
  unit_cost: number;
}

export default function GoodsReceivedFormPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toasterId = useId('toaster');
  const { dispatchToast } = useToastController(toasterId);

  const [loading, setLoading] = useState(false);
  const [loadingPO, setLoadingPO] = useState(true);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [selectedPO, setSelectedPO] = useState<any>(null);
  const [poItems, setPoItems] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    po_id: undefined as number | undefined,
    received_date: new Date(),
    vendor_invoice_number: '',
    vendor_invoice_date: undefined as Date | undefined,
    branch_id: 1,
    notes: '',
  });
  const [lineItems, setLineItems] = useState<GRNLineItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadPurchaseOrders();
    const poIdParam = searchParams.get('poId');
    if (poIdParam) {
      handlePOSelect(parseInt(poIdParam));
    }
  }, []);

  const loadPurchaseOrders = async () => {
    try {
      setLoadingPO(true);
      const orders = await PurchasesService.getPurchaseOrders({ status: 'draft' });
      setPurchaseOrders(orders);
    } catch (error) {
      dispatchToast(<div>Failed to load purchase orders: {(error as Error).message}</div>, {
        intent: 'error',
      });
    } finally {
      setLoadingPO(false);
    }
  };

  const handlePOSelect = async (poId: number) => {
    try {
      setLoading(true);
      const po = await PurchasesService.getPurchaseOrderById(poId);
      if (po) {
        setSelectedPO(po);
        setFormData({ ...formData, po_id: poId });

        // Load PO items - in real implementation, get from service
        // For now, create placeholder items
        const items: GRNLineItem[] = [];
        // TODO: Load actual PO items from service
        setLineItems(items);
      }
    } catch (error) {
      dispatchToast(<div>Failed to load purchase order: {(error as Error).message}</div>, {
        intent: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateLineItem = (index: number, field: keyof GRNLineItem, value: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };

    // Calculate rejected quantity if accepted + rejected > received
    if (field === 'accepted_quantity' || field === 'received_quantity') {
      const item = updated[index];
      const total = (item.accepted_quantity || 0) + (item.rejected_quantity || 0);
      if (total > item.received_quantity) {
        updated[index].rejected_quantity = Math.max(
          0,
          item.received_quantity - item.accepted_quantity,
        );
      }
    }

    setLineItems(updated);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.po_id) {
      newErrors.po_id = 'Purchase order is required';
    }

    if (lineItems.length === 0) {
      newErrors.lineItems = 'No items to receive';
    }

    lineItems.forEach((item, index) => {
      if (item.received_quantity <= 0) {
        newErrors[`item_${index}_received`] = 'Received quantity must be greater than 0';
      }
      if (item.accepted_quantity + item.rejected_quantity > item.received_quantity) {
        newErrors[`item_${index}_accepted`] = 'Accepted + Rejected cannot exceed Received';
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

      await PurchasesService.createGRN({
        po_id: formData.po_id!,
        vendor_id: selectedPO.vendor_id,
        received_date: formData.received_date.toISOString().split('T')[0],
        branch_id: formData.branch_id,
        vendor_invoice_number: formData.vendor_invoice_number || undefined,
        vendor_invoice_date: formData.vendor_invoice_date?.toISOString().split('T')[0],
        items: lineItems.map((item) => ({
          po_item_id: item.po_item_id,
          product_id: item.product_id,
          ordered_quantity: item.ordered_quantity,
          received_quantity: item.received_quantity,
          accepted_quantity: item.accepted_quantity,
          rejected_quantity: item.rejected_quantity,
          rejection_reason: item.rejection_reason || undefined,
          unit_cost: item.unit_cost,
        })),
        notes: formData.notes,
      });

      dispatchToast(<div>Goods received successfully</div>, { intent: 'success' });
      navigate('/purchases/goods-received/list');
    } catch (error) {
      dispatchToast(<div>Failed to save GRN: {(error as Error).message}</div>, {
        intent: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadingPO) {
    return <LoadingSpinner variant="page" />;
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1>Receive Goods (GRN)</h1>
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
                label="Purchase Order"
                name="po_id"
                value={formData.po_id}
                onChange={(value) => handlePOSelect(value as number)}
                options={purchaseOrders.map((po) => ({
                  value: po.id,
                  label: `${po.po_number} - ${formatCurrency(po.grand_total)}`,
                }))}
                required
                error={errors.po_id}
                placeholder="Select purchase order"
              />
              <FormDatePicker
                label="Received Date"
                name="received_date"
                value={formData.received_date}
                onChange={(value) =>
                  setFormData({ ...formData, received_date: value || new Date() })
                }
                required
              />
              <FormInput
                label="Vendor Invoice Number"
                name="vendor_invoice_number"
                value={formData.vendor_invoice_number}
                onChange={(value) => setFormData({ ...formData, vendor_invoice_number: value })}
                placeholder="Optional"
              />
              <FormDatePicker
                label="Vendor Invoice Date"
                name="vendor_invoice_date"
                value={formData.vendor_invoice_date}
                onChange={(value) =>
                  setFormData({ ...formData, vendor_invoice_date: value || undefined })
                }
              />
            </div>

            {selectedPO && (
              <div
                style={{
                  marginBottom: '24px',
                  padding: '16px',
                  background: '#f5f5f5',
                  borderRadius: '4px',
                }}
              >
                <h3 style={{ marginTop: 0 }}>Purchase Order: {selectedPO.po_number}</h3>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px',
                    fontSize: '14px',
                  }}
                >
                  <div>Vendor: Vendor {selectedPO.vendor_id}</div>
                  <div>Order Date: {formatDate(selectedPO.order_date)}</div>
                  <div>Total: {formatCurrency(selectedPO.grand_total)}</div>
                  <div>Status: {selectedPO.status}</div>
                </div>
              </div>
            )}

            {lineItems.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <h2>Received Items</h2>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    border: '1px solid #e1e1e1',
                    borderRadius: '4px',
                    overflow: 'hidden',
                  }}
                >
                  <thead style={{ background: '#f5f5f5' }}>
                    <tr>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>
                        Product
                      </th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>
                        Ordered
                      </th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>
                        Received
                      </th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>
                        Accepted
                      </th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>
                        Rejected
                      </th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>
                        Reason
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((item, index) => (
                      <tr key={index} style={{ borderTop: '1px solid #f5f5f5' }}>
                        <td style={{ padding: '12px' }}>{item.product_name}</td>
                        <td style={{ padding: '12px' }}>{item.ordered_quantity}</td>
                        <td style={{ padding: '12px' }}>
                          <FormNumberInput
                            label=""
                            name={`received_${index}`}
                            value={item.received_quantity}
                            onChange={(value) =>
                              updateLineItem(index, 'received_quantity', value || 0)
                            }
                            min={0}
                            step={0.01}
                          />
                        </td>
                        <td style={{ padding: '12px' }}>
                          <FormNumberInput
                            label=""
                            name={`accepted_${index}`}
                            value={item.accepted_quantity}
                            onChange={(value) =>
                              updateLineItem(index, 'accepted_quantity', value || 0)
                            }
                            min={0}
                            step={0.01}
                          />
                        </td>
                        <td style={{ padding: '12px' }}>
                          <FormNumberInput
                            label=""
                            name={`rejected_${index}`}
                            value={item.rejected_quantity}
                            onChange={(value) =>
                              updateLineItem(index, 'rejected_quantity', value || 0)
                            }
                            min={0}
                            step={0.01}
                          />
                        </td>
                        <td style={{ padding: '12px' }}>
                          <FormInput
                            label=""
                            name={`reason_${index}`}
                            value={item.rejection_reason}
                            onChange={(value) => updateLineItem(index, 'rejection_reason', value)}
                            placeholder="If rejected"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <FormTextarea
              label="Notes"
              name="notes"
              value={formData.notes}
              onChange={(value) => setFormData({ ...formData, notes: value })}
              rows={3}
            />
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
              {selectedPO && (
                <div style={{ display: 'grid', gap: '12px', marginTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>PO Number:</span>
                    <strong>{selectedPO.po_number}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>PO Total:</span>
                    <strong>{formatCurrency(selectedPO.grand_total)}</strong>
                  </div>
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
            onClick={() => navigate('/purchases/goods-received/list')}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            Receive Goods
          </Button>
        </div>
      </form>
    </div>
  );
}
