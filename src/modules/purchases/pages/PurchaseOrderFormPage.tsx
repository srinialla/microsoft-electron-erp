import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../renderer/components/ui/Button';
import {
  FormDatePicker,
  FormCurrency,
  FormNumberInput,
  FormTextarea,
  SearchableDropdown,
} from '../../../shared/components';
import PurchasesService from '../services/PurchasesService';
import VendorService from '../../inventory/services/VendorService';
import ProductService from '../../inventory/services/ProductService';
import type { Vendor, Product } from '../../../shared/types/entities';
import { calculateLineTotal, calculateDocumentTotals } from '../../../shared/utils/calculations';
import { formatCurrency } from '../../../shared/utils/formatting';
import { useToastController, useId } from '@fluentui/react-components';
import { Dismiss24Regular } from '@fluentui/react-icons';

interface LineItem {
  product_id?: number;
  product_name?: string;
  description?: string;
  quantity: number;
  unit_cost: number;
  discount_percent: number;
  tax_rate: number;
  line_total: number;
}

export default function PurchaseOrderFormPage() {
  const navigate = useNavigate();
  const toasterId = useId('toaster');
  const { dispatchToast } = useToastController(toasterId);

  const [loading, setLoading] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [formData, setFormData] = useState({
    vendor_id: undefined as number | undefined,
    order_date: new Date(),
    expected_delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    branch_id: 1,
    shipping_charges: 0,
    notes: '',
  });
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadOptions();
  }, []);

  const loadOptions = async () => {
    try {
      const [vends, prods] = await Promise.all([
        VendorService.getVendors(),
        ProductService.getProducts(),
      ]);
      setVendors(vends);
      setProducts(prods);
    } catch (error) {
      console.error('Failed to load options:', error);
    }
  };

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        quantity: 1,
        unit_cost: 0,
        discount_percent: 0,
        tax_rate: 0,
        line_total: 0,
      },
    ]);
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };

    // Recalculate line total
    const item = updated[index];
    if (item.product_id && item.quantity && item.unit_cost) {
      const calc = calculateLineTotal(
        item.quantity,
        item.unit_cost,
        item.discount_percent || 0,
        item.tax_rate || 0,
      );
      updated[index].line_total = calc.lineTotal;
    }

    setLineItems(updated);
  };

  const selectProduct = (index: number, product: Product) => {
    const updated = [...lineItems];
    updated[index] = {
      ...updated[index],
      product_id: product.id,
      product_name: product.name,
      unit_cost: product.cost_price,
      tax_rate: product.tax_rate || 0,
    };
    setLineItems(updated);
  };

  const totals = calculateDocumentTotals(
    lineItems.map((item) => ({
      quantity: item.quantity,
      unitPrice: item.unit_cost,
      discountPercent: item.discount_percent,
      taxRate: item.tax_rate,
    })),
    'percentage',
    0,
    formData.shipping_charges,
  );

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.vendor_id) {
      newErrors.vendor_id = 'Vendor is required';
    }

    if (lineItems.length === 0) {
      newErrors.lineItems = 'At least one line item is required';
    }

    lineItems.forEach((item, index) => {
      if (!item.product_id) {
        newErrors[`item_${index}_product`] = 'Product is required';
      }
      if (!item.quantity || item.quantity <= 0) {
        newErrors[`item_${index}_quantity`] = 'Quantity must be greater than 0';
      }
      if (!item.unit_cost || item.unit_cost <= 0) {
        newErrors[`item_${index}_cost`] = 'Unit cost must be greater than 0';
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

      await PurchasesService.createPurchaseOrder({
        vendor_id: formData.vendor_id!,
        order_date: formData.order_date.toISOString().split('T')[0],
        expected_delivery_date: formData.expected_delivery_date.toISOString().split('T')[0],
        branch_id: formData.branch_id,
        items: lineItems
          .filter((item) => item.product_id)
          .map((item) => ({
            product_id: item.product_id!,
            description: item.description,
            quantity: item.quantity,
            unit_cost: item.unit_cost,
            discount_percent: item.discount_percent,
            tax_rate: item.tax_rate,
          })),
        shipping_charges: formData.shipping_charges,
        notes: formData.notes,
      });

      dispatchToast(<div>Purchase order created successfully</div>, { intent: 'success' });
      navigate('/purchases/order/list');
    } catch (error) {
      dispatchToast(<div>Failed to save purchase order: {(error as Error).message}</div>, {
        intent: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1>New Purchase Order</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          <div>
            {/* Header */}
            <div
              style={{
                marginBottom: '24px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
              }}
            >
              <SearchableDropdown
                label="Vendor"
                name="vendor_id"
                value={formData.vendor_id}
                onChange={(value) =>
                  setFormData({ ...formData, vendor_id: value as number | undefined })
                }
                options={vendors.map((v) => ({ value: v.id, label: v.display_name }))}
                required
                error={errors.vendor_id}
              />
              <FormDatePicker
                label="Order Date"
                name="order_date"
                value={formData.order_date}
                onChange={(value) => setFormData({ ...formData, order_date: value || new Date() })}
                required
              />
              <FormDatePicker
                label="Expected Delivery"
                name="expected_delivery_date"
                value={formData.expected_delivery_date}
                onChange={(value) =>
                  setFormData({ ...formData, expected_delivery_date: value || new Date() })
                }
              />
            </div>

            {/* Line Items */}
            <div style={{ marginBottom: '24px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                }}
              >
                <h2>Line Items</h2>
                <Button type="button" variant="outline" onClick={addLineItem}>
                  Add Item
                </Button>
              </div>
              {errors.lineItems && (
                <div style={{ color: '#d13438', marginBottom: '8px' }}>{errors.lineItems}</div>
              )}
              <table className="invoice-items-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Cost</th>
                    <th>Disc %</th>
                    <th>Tax %</th>
                    <th>Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item, index) => (
                    <tr key={index}>
                      <td>
                        <SearchableDropdown
                          label=""
                          name={`product_${index}`}
                          value={item.product_id}
                          onChange={(value) =>
                            selectProduct(index, products.find((p) => p.id === value)! as Product)
                          }
                          options={products.map((p) => ({ value: p.id, label: p.name }))}
                          placeholder="Select product"
                        />
                      </td>
                      <td>
                        <FormNumberInput
                          label=""
                          name={`qty_${index}`}
                          value={item.quantity}
                          onChange={(value) => updateLineItem(index, 'quantity', value || 0)}
                          min={0.01}
                          step={0.01}
                        />
                      </td>
                      <td>
                        <FormCurrency
                          label=""
                          name={`cost_${index}`}
                          value={item.unit_cost}
                          onChange={(value) => updateLineItem(index, 'unit_cost', value || 0)}
                          min={0}
                        />
                      </td>
                      <td>
                        <FormNumberInput
                          label=""
                          name={`disc_${index}`}
                          value={item.discount_percent}
                          onChange={(value) =>
                            updateLineItem(index, 'discount_percent', value || 0)
                          }
                          min={0}
                          max={100}
                          decimals={2}
                        />
                      </td>
                      <td>
                        <FormNumberInput
                          label=""
                          name={`tax_${index}`}
                          value={item.tax_rate}
                          onChange={(value) => updateLineItem(index, 'tax_rate', value || 0)}
                          min={0}
                          max={100}
                          decimals={2}
                        />
                      </td>
                      <td style={{ fontWeight: 500 }}>{formatCurrency(item.line_total)}</td>
                      <td>
                        <button
                          type="button"
                          onClick={() => removeLineItem(index)}
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
              </table>
            </div>

            <FormTextarea
              label="Notes"
              name="notes"
              value={formData.notes}
              onChange={(value) => setFormData({ ...formData, notes: value })}
              rows={4}
            />
          </div>

          {/* Totals Sidebar */}
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
              <div style={{ display: 'grid', gap: '12px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Subtotal:</span>
                  <strong>{formatCurrency(totals.subtotal)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Tax:</span>
                  <strong>{formatCurrency(totals.totalTax)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Shipping:</span>
                  <strong>{formatCurrency(formData.shipping_charges)}</strong>
                </div>
                <div
                  style={{
                    borderTop: '2px solid #e1e1e1',
                    paddingTop: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '18px',
                    fontWeight: 600,
                  }}
                >
                  <span>Grand Total:</span>
                  <span>{formatCurrency(totals.grandTotal)}</span>
                </div>
              </div>
              <FormCurrency
                label="Shipping Charges"
                name="shipping_charges"
                value={formData.shipping_charges}
                onChange={(value) => setFormData({ ...formData, shipping_charges: value || 0 })}
                min={0}
              />
            </div>
          </div>
        </div>

        <div
          style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}
        >
          <Button
            variant="outline"
            onClick={() => navigate('/purchases/order/list')}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            Create Purchase Order
          </Button>
        </div>
      </form>
    </div>
  );
}
