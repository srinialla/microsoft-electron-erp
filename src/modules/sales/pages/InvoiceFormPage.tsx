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
  FormCheckbox,
  SearchableDropdown,
} from '../../../shared/components';
import SalesService from '../services/SalesService';
import ProductService from '../../inventory/services/ProductService';
import CustomerService from '../../customers/services/CustomerService';
import type { Product, Customer } from '../../../shared/types/entities';
import { calculateLineTotal, calculateDocumentTotals } from '../../../shared/utils/calculations';
import { formatCurrency } from '../../../shared/utils/formatting';
import { useToastController, useId } from '@fluentui/react-components';
import { Dismiss24Regular } from '@fluentui/react-icons';
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

export default function InvoiceFormPage() {
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
    invoice_date: new Date(),
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    branch_id: 1,
    discount_type: 'percentage' as 'fixed' | 'percentage',
    discount_value: 0,
    shipping_charges: 0,
    notes: '',
    record_payment: false,
    payment_amount: 0,
    payment_method: 'cash',
    payment_date: new Date(),
  });
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadOptions();
    if (isEdit && id) {
      loadInvoice(parseInt(id));
    }
  }, [id, isEdit]);

  const loadOptions = async () => {
    try {
      const [custs, prods] = await Promise.all([
        CustomerService.getCustomers(),
        ProductService.getProducts(),
      ]);
      setCustomers(custs);
      setProducts(prods);
    } catch (error) {
      console.error('Failed to load options:', error);
    }
  };

  const loadInvoice = async (invoiceId: number) => {
    try {
      setLoading(true);
      const [invoice, items] = await Promise.all([
        SalesService.getInvoiceById(invoiceId),
        SalesService.getInvoiceItems(invoiceId),
      ]);

      if (invoice) {
        setFormData({
          customer_id: invoice.customer_id,
          invoice_date: new Date(invoice.invoice_date),
          due_date: new Date(invoice.due_date),
          branch_id: invoice.branch_id || 1,
          discount_type: 'percentage',
          discount_value: 0,
          shipping_charges: invoice.shipping_charges,
          notes: invoice.notes || '',
          record_payment: invoice.payment_status === 'paid',
          payment_amount: invoice.paid_amount,
          payment_method: 'cash',
          payment_date: new Date(invoice.invoice_date),
        });

        // Load line items
        const loadedItems: LineItem[] = [];
        for (const item of items) {
          const product = await ProductService.getProductById(item.product_id);
          loadedItems.push({
            product_id: item.product_id,
            product_name: product?.name || 'Unknown',
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            discount_percent: item.discount_percent,
            tax_rate: item.tax_rate,
            line_total: item.line_total,
          });
        }
        setLineItems(loadedItems);
      }
    } catch (error) {
      dispatchToast(<div>Failed to load invoice: {(error as Error).message}</div>, {
        intent: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const addLineItem = () => {
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

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };

    // Recalculate line total
    const item = updated[index];
    if (item.product_id && item.quantity && item.unit_price) {
      const calc = calculateLineTotal(
        item.quantity,
        item.unit_price,
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
      unit_price: product.selling_price,
      tax_rate: product.tax_rate || 0,
    };
    updateLineItem(index, 'product_id', product.id);
    setLineItems(updated);
  };

  const totals = calculateDocumentTotals(
    lineItems.map((item) => ({
      quantity: item.quantity,
      unitPrice: item.unit_price,
      discountPercent: item.discount_percent,
      taxRate: item.tax_rate,
    })),
    formData.discount_type,
    formData.discount_value,
    formData.shipping_charges,
  );

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.customer_id) {
      newErrors.customer_id = 'Customer is required';
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
      if (!item.unit_price || item.unit_price <= 0) {
        newErrors[`item_${index}_price`] = 'Unit price must be greater than 0';
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

      await SalesService.createInvoice({
        customer_id: formData.customer_id!,
        invoice_date: formData.invoice_date.toISOString().split('T')[0],
        due_date: formData.due_date.toISOString().split('T')[0],
        branch_id: formData.branch_id,
        items: lineItems
          .filter((item) => item.product_id)
          .map((item) => ({
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
        record_payment: formData.record_payment
          ? {
              amount: formData.payment_amount,
              payment_method: formData.payment_method,
              payment_date: formData.payment_date.toISOString().split('T')[0],
            }
          : undefined,
      });

      dispatchToast(<div>Invoice created successfully</div>, { intent: 'success' });
      navigate('/sales/invoice/list');
    } catch (error) {
      dispatchToast(<div>Failed to save invoice: {(error as Error).message}</div>, {
        intent: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1>{isEdit ? 'Edit Invoice' : 'New Invoice'}</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          {/* Main Form */}
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
                label="Customer"
                name="customer_id"
                value={formData.customer_id}
                onChange={(value) =>
                  setFormData({ ...formData, customer_id: value as number | undefined })
                }
                options={customers.map((c) => ({ value: c.id, label: c.display_name }))}
                required
                error={errors.customer_id}
              />
              <FormDatePicker
                label="Invoice Date"
                name="invoice_date"
                value={formData.invoice_date}
                onChange={(value) =>
                  setFormData({ ...formData, invoice_date: value || new Date() })
                }
                required
              />
              <FormDatePicker
                label="Due Date"
                name="due_date"
                value={formData.due_date}
                onChange={(value) => setFormData({ ...formData, due_date: value || new Date() })}
                required
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
                    <th>Price</th>
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
                          name={`price_${index}`}
                          value={item.unit_price}
                          onChange={(value) => updateLineItem(index, 'unit_price', value || 0)}
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

            {/* Payment Section */}
            <div style={{ marginBottom: '24px' }}>
              <h2>Payment</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <FormCheckbox
                  label="Record Payment"
                  name="record_payment"
                  checked={formData.record_payment}
                  onChange={(checked) => setFormData({ ...formData, record_payment: checked })}
                />
                {formData.record_payment && (
                  <>
                    <FormCurrency
                      label="Payment Amount"
                      name="payment_amount"
                      value={formData.payment_amount}
                      onChange={(value) => setFormData({ ...formData, payment_amount: value || 0 })}
                      min={0}
                    />
                    <FormSelect
                      label="Payment Method"
                      name="payment_method"
                      value={formData.payment_method}
                      onChange={(value) =>
                        setFormData({ ...formData, payment_method: value as string })
                      }
                      options={[
                        { value: 'cash', label: 'Cash' },
                        { value: 'check', label: 'Check' },
                        { value: 'bank_transfer', label: 'Bank Transfer' },
                        { value: 'card', label: 'Card' },
                      ]}
                    />
                    <FormDatePicker
                      label="Payment Date"
                      name="payment_date"
                      value={formData.payment_date}
                      onChange={(value) =>
                        setFormData({ ...formData, payment_date: value || new Date() })
                      }
                    />
                  </>
                )}
              </div>
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
                  <span>Discount:</span>
                  <strong>{formatCurrency(totals.totalDiscount)}</strong>
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
              <FormNumberInput
                label="Discount Value"
                name="discount_value"
                value={formData.discount_value}
                onChange={(value) => setFormData({ ...formData, discount_value: value || 0 })}
                min={0}
              />
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
            onClick={() => navigate('/sales/invoice/list')}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            {isEdit ? 'Update' : 'Create'} Invoice
          </Button>
        </div>
      </form>
    </div>
  );
}
