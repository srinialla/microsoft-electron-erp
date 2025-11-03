import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../../renderer/components/ui/Button';
import {
  FormInput,
  FormSelect,
  FormTextarea,
  FormDatePicker,
  FormCurrency,
  FormNumberInput,
  SearchableDropdown,
} from '../../../shared/components';
import SalesService from '../services/SalesService';
import ProductService from '../../inventory/services/ProductService';
import CustomerService from '../../customers/services/CustomerService';
import type { Product, Customer } from '../../../shared/types/entities';
import { calculateLineTotal, calculateDocumentTotals } from '../../../shared/utils/calculations';
import { formatCurrency } from '../../../shared/utils/formatting';
import { useToastController, useId } from '@fluentui/react-components';
import { Dismiss24Regular, Add24Regular } from '@fluentui/react-icons';
import './InvoiceFormPage.css';

interface LineItem {
  product_id?: number;
  product_name?: string;
  description?: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  tax_rate: number;
  line_total: number;
}

export default function SalesOrderFormPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const toasterId = useId('toaster');
  const { dispatchToast } = useToastController(toasterId);
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [formData, setFormData] = useState({
    customer_id: undefined as number | undefined,
    order_date: new Date(),
    expected_delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    branch_id: 1,
    discount_type: 'percentage' as 'fixed' | 'percentage',
    discount_value: 0,
    shipping_address: '',
    shipping_charges: 0,
    notes: '',
    terms_and_conditions: '',
  });
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [allCustomers, allProducts] = await Promise.all([
        CustomerService.getCustomers(),
        ProductService.getProducts(),
      ]);
      setCustomers(allCustomers);
      setProducts(allProducts);
    } catch (error) {
      dispatchToast(<div>Failed to load data: {(error as Error).message}</div>, {
        intent: 'error',
      });
    }
  };

  const handleAddLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        quantity: 1,
        unit_price: 0,
        discount_percent: 0,
        tax_rate: 0,
        line_total: 0,
      },
    ]);
  };

  const handleProductSelect = (product: Product | null, index: number) => {
    if (!product) return;

    const updated = [...lineItems];
    updated[index].product_id = product.id;
    updated[index].product_name = product.name || '';
    updated[index].unit_price = product.selling_price || 0;
    updated[index].tax_rate = product.tax_rate || 0;

    const lineTotal = calculateLineTotal(
      updated[index].quantity,
      updated[index].unit_price,
      updated[index].discount_percent,
      updated[index].tax_rate,
    );
    updated[index].line_total = lineTotal.lineTotal;

    setLineItems(updated);
  };

  const handleLineItemChange = (index: number, field: keyof LineItem, value: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };

    if (
      field === 'quantity' ||
      field === 'unit_price' ||
      field === 'discount_percent' ||
      field === 'tax_rate'
    ) {
      const lineTotal = calculateLineTotal(
        updated[index].quantity,
        updated[index].unit_price,
        updated[index].discount_percent,
        updated[index].tax_rate,
      );
      updated[index].line_total = lineTotal.lineTotal;
    }

    setLineItems(updated);
  };

  const handleRemoveLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (lineItems.length === 0) {
      dispatchToast(<div>Please add at least one item</div>, { intent: 'warning' });
      return;
    }

    try {
      setLoading(true);

      if (isEdit && id) {
        // TODO: Implement updateOrder
        dispatchToast(<div>Update functionality coming soon</div>, { intent: 'info' });
      } else {
        await SalesService.createOrder({
          customer_id: formData.customer_id!,
          order_date: formData.order_date.toISOString().split('T')[0],
          expected_delivery_date: formData.expected_delivery_date.toISOString().split('T')[0],
          branch_id: formData.branch_id,
          shipping_address: formData.shipping_address,
          items: lineItems.map((item) => ({
            product_id: item.product_id!,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            discount_percent: item.discount_percent,
            tax_rate: item.tax_rate,
          })),
          discount_type: formData.discount_type,
          discount_value: formData.discount_value,
          shipping_charges: formData.shipping_charges,
          notes: formData.notes,
          terms_and_conditions: formData.terms_and_conditions,
        });

        dispatchToast(<div>Sales order created successfully</div>, { intent: 'success' });
        navigate('/sales/orders/list');
      }
    } catch (error) {
      dispatchToast(<div>Failed to save order: {(error as Error).message}</div>, {
        intent: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateDocumentTotals(
    lineItems,
    formData.discount_type,
    formData.discount_value,
    formData.shipping_charges,
  );

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1>{isEdit ? 'Edit' : 'New'} Sales Order</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: '24px',
            marginBottom: '24px',
          }}
        >
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
                placeholder="Select customer..."
                value={customers.find((c) => c.id === formData.customer_id) || null}
                onChange={(customer) => setFormData({ ...formData, customer_id: customer?.id })}
                getItems={async (search) => {
                  const filtered = customers.filter(
                    (c) =>
                      c.display_name?.toLowerCase().includes(search.toLowerCase()) ||
                      c.customer_code?.toLowerCase().includes(search.toLowerCase()),
                  );
                  return filtered.map((c) => ({
                    value: c.id,
                    label: `${c.customer_code} - ${c.display_name}`,
                    data: c,
                  }));
                }}
                required
                error={errors.customer_id}
              />
              <FormDatePicker
                label="Order Date"
                name="order_date"
                value={formData.order_date}
                onChange={(value) => setFormData({ ...formData, order_date: value || new Date() })}
                required
              />
              <FormDatePicker
                label="Expected Delivery Date"
                name="expected_delivery_date"
                value={formData.expected_delivery_date}
                onChange={(value) =>
                  setFormData({
                    ...formData,
                    expected_delivery_date: value || new Date(),
                  })
                }
                required
              />
            </div>

            <FormTextarea
              label="Shipping Address"
              name="shipping_address"
              value={formData.shipping_address}
              onChange={(value) => setFormData({ ...formData, shipping_address: value })}
              rows={3}
            />
          </div>

          <div>
            <h2>Order Summary</h2>
            <div style={{ display: 'grid', gap: '12px', marginBottom: '16px' }}>
              <FormSelect
                label="Discount Type"
                name="discount_type"
                value={formData.discount_type}
                onChange={(value) =>
                  setFormData({ ...formData, discount_type: value as 'fixed' | 'percentage' })
                }
                options={[
                  { value: 'percentage', label: 'Percentage' },
                  { value: 'fixed', label: 'Fixed Amount' },
                ]}
              />
              <FormCurrency
                label="Discount Value"
                name="discount_value"
                value={formData.discount_value}
                onChange={(value) => setFormData({ ...formData, discount_value: value || 0 })}
              />
              <FormCurrency
                label="Shipping Charges"
                name="shipping_charges"
                value={formData.shipping_charges}
                onChange={(value) => setFormData({ ...formData, shipping_charges: value || 0 })}
              />
            </div>

            <div style={{ background: '#f5f5f5', padding: '16px', borderRadius: '4px' }}>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}
              >
                <span>Subtotal:</span>
                <span>{formatCurrency(totals.subtotal)}</span>
              </div>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}
              >
                <span>Discount:</span>
                <span>-{formatCurrency(totals.discountAmount)}</span>
              </div>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}
              >
                <span>Tax:</span>
                <span>{formatCurrency(totals.taxAmount)}</span>
              </div>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}
              >
                <span>Shipping:</span>
                <span>{formatCurrency(totals.shippingCharges)}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '12px',
                  paddingTop: '12px',
                  borderTop: '2px solid #e1e1e1',
                  fontSize: '18px',
                  fontWeight: 600,
                }}
              >
                <span>Grand Total:</span>
                <span>{formatCurrency(totals.grandTotal)}</span>
              </div>
            </div>
          </div>
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
            <h2>Order Items</h2>
            <Button
              type="button"
              variant="outline"
              onClick={handleAddLineItem}
              icon={<Add24Regular />}
            >
              Add Item
            </Button>
          </div>

          {lineItems.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '48px',
                background: '#f5f5f5',
                borderRadius: '4px',
              }}
            >
              <p>No items added. Click "Add Item" to start.</p>
            </div>
          ) : (
            <table className="invoice-items-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Description</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Discount %</th>
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
                        placeholder="Select product..."
                        value={products.find((p) => p.id === item.product_id) || null}
                        onChange={(p) => handleProductSelect(p, index)}
                        getItems={async (search) => {
                          const filtered = products.filter(
                            (p) =>
                              p.name?.toLowerCase().includes(search.toLowerCase()) ||
                              p.product_code?.toLowerCase().includes(search.toLowerCase()),
                          );
                          return filtered.map((p) => ({
                            value: p.id,
                            label: `${p.product_code} - ${p.name}`,
                            data: p,
                          }));
                        }}
                      />
                    </td>
                    <td>
                      <FormInput
                        label=""
                        name={`desc_${index}`}
                        value={item.description || ''}
                        onChange={(value) => handleLineItemChange(index, 'description', value)}
                      />
                    </td>
                    <td>
                      <FormNumberInput
                        label=""
                        name={`qty_${index}`}
                        value={item.quantity}
                        onChange={(value) => handleLineItemChange(index, 'quantity', value || 0)}
                        min={0.01}
                        step={0.01}
                      />
                    </td>
                    <td>
                      <FormCurrency
                        label=""
                        name={`price_${index}`}
                        value={item.unit_price}
                        onChange={(value) => handleLineItemChange(index, 'unit_price', value || 0)}
                        min={0}
                      />
                    </td>
                    <td>
                      <FormNumberInput
                        label=""
                        name={`disc_${index}`}
                        value={item.discount_percent}
                        onChange={(value) =>
                          handleLineItemChange(index, 'discount_percent', value || 0)
                        }
                        min={0}
                        max={100}
                        step={0.01}
                      />
                    </td>
                    <td>
                      <FormNumberInput
                        label=""
                        name={`tax_${index}`}
                        value={item.tax_rate}
                        onChange={(value) => handleLineItemChange(index, 'tax_rate', value || 0)}
                        min={0}
                        max={100}
                        step={0.01}
                      />
                    </td>
                    <td>{formatCurrency(item.line_total)}</td>
                    <td>
                      <Button
                        type="button"
                        size="small"
                        variant="outline"
                        onClick={() => handleRemoveLineItem(index)}
                        icon={<Dismiss24Regular />}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ marginBottom: '24px' }}>
          <FormTextarea
            label="Notes"
            name="notes"
            value={formData.notes}
            onChange={(value) => setFormData({ ...formData, notes: value })}
            rows={3}
          />
          <FormTextarea
            label="Terms & Conditions"
            name="terms_and_conditions"
            value={formData.terms_and_conditions}
            onChange={(value) => setFormData({ ...formData, terms_and_conditions: value })}
            rows={3}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <Button
            variant="outline"
            onClick={() => navigate('/sales/orders/list')}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            {isEdit ? 'Update' : 'Create'} Order
          </Button>
        </div>
      </form>
    </div>
  );
}
