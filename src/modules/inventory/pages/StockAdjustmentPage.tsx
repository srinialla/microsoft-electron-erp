import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../renderer/components/ui/Button';
import {
    FormInput,
    FormSelect,
    FormTextarea,
    FormDatePicker,
    FormNumberInput,
    SearchableDropdown,
} from '../../../shared/components';
import InventoryService from '../services/InventoryService';
import ProductService from '../services/ProductService';
import type { Product, Branch } from '../../../shared/types/entities';
import { formatCurrency } from '../../../shared/utils/formatting';
import { useToastController, useId } from '@fluentui/react-components';
import { Add24Regular, Dismiss24Regular } from '@fluentui/react-icons';

interface AdjustmentItem {
    product_id?: number;
    product_name?: string;
    current_quantity: number;
    adjustment_quantity: number;
    new_quantity: number;
    reason?: string;
}

export default function StockAdjustmentPage() {
    const navigate = useNavigate();
    const toasterId = useId('toaster');
    const { dispatchToast } = useToastController(toasterId);

    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [formData, setFormData] = useState({
        branch_id: 1,
        adjustment_date: new Date(),
        adjustment_type: 'increase' as 'increase' | 'decrease',
        reason: '',
        notes: '',
    });
    const [lineItems, setLineItems] = useState<AdjustmentItem[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (formData.branch_id && lineItems.length > 0) {
            loadCurrentQuantities();
        }
    }, [formData.branch_id]);

    const loadData = async () => {
        try {
            const [allProducts, allBranches] = await Promise.all([
                ProductService.getProducts({ product_type: 'physical' }),
                InventoryService.getBranches(),
            ]);
            setProducts(allProducts);
            setBranches(allBranches);
            if (allBranches.length > 0 && !formData.branch_id) {
                setFormData((prev) => ({ ...prev, branch_id: allBranches[0].id }));
            }
        } catch (error) {
            dispatchToast(<div>Failed to load data: {(error as Error).message}</div>, { intent: 'error' });
        }
    };

    const loadCurrentQuantities = async () => {
        for (let i = 0; i < lineItems.length; i++) {
            if (lineItems[i].product_id) {
                const stock = await ProductService.getProductStock(lineItems[i].product_id!, formData.branch_id);
                const updated = [...lineItems];
                updated[i].current_quantity = stock?.quantity_on_hand || 0;
                updated[i].new_quantity =
                    formData.adjustment_type === 'increase'
                        ? updated[i].current_quantity + updated[i].adjustment_quantity
                        : updated[i].current_quantity - updated[i].adjustment_quantity;
                setLineItems(updated);
            }
        }
    };

    const handleAddLineItem = () => {
        setLineItems([
            ...lineItems,
            {
                current_quantity: 0,
                adjustment_quantity: 0,
                new_quantity: 0,
            },
        ]);
    };

    const handleProductSelect = async (product: Product | null, index: number) => {
        if (!product) return;

        const updated = [...lineItems];
        updated[index].product_id = product.id;
        updated[index].product_name = product.name || '';

        // Load current stock
        const stock = await ProductService.getProductStock(product.id, formData.branch_id);
        updated[index].current_quantity = stock?.quantity_on_hand || 0;
        updated[index].new_quantity =
            formData.adjustment_type === 'increase'
                ? updated[index].current_quantity + updated[index].adjustment_quantity
                : updated[index].current_quantity - updated[index].adjustment_quantity;

        setLineItems(updated);
    };

    const handleQuantityChange = (index: number, value: number) => {
        const updated = [...lineItems];
        updated[index].adjustment_quantity = Math.max(0, value);
        updated[index].new_quantity =
            formData.adjustment_type === 'increase'
                ? updated[index].current_quantity + updated[index].adjustment_quantity
                : Math.max(0, updated[index].current_quantity - updated[index].adjustment_quantity);
        setLineItems(updated);
    };

    const handleRemoveItem = (index: number) => {
        setLineItems(lineItems.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (lineItems.length === 0) {
            dispatchToast(<div>Please add at least one item</div>, { intent: 'warning' });
            return;
        }

        const validationErrors: Record<string, string> = {};
        if (!formData.reason) {
            validationErrors.reason = 'Reason is required';
        }

        lineItems.forEach((item, index) => {
            if (!item.product_id) {
                validationErrors[`item_${index}`] = 'Product is required';
            }
            if (item.adjustment_quantity <= 0) {
                validationErrors[`qty_${index}`] = 'Adjustment quantity must be greater than 0';
            }
            if (formData.adjustment_type === 'decrease' && item.adjustment_quantity > item.current_quantity) {
                validationErrors[`qty_${index}`] = 'Cannot decrease more than current quantity';
            }
        });

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        try {
            setLoading(true);

            await InventoryService.createStockAdjustment({
                branch_id: formData.branch_id,
                adjustment_date: formData.adjustment_date.toISOString().split('T')[0],
                adjustment_type: formData.adjustment_type,
                reason: formData.reason,
                notes: formData.notes,
                items: lineItems.map((item) => ({
                    product_id: item.product_id!,
                    current_quantity: item.current_quantity,
                    adjustment_quantity: item.adjustment_quantity,
                    reason: item.reason,
                })),
            });

            dispatchToast(<div>Stock adjustment created successfully</div>, { intent: 'success' });
            navigate('/inventory/stock-report');
        } catch (error) {
            dispatchToast(<div>Failed to create adjustment: {(error as Error).message}</div>, { intent: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h1>Stock Adjustment</h1>
                <Button variant="outline" onClick={() => navigate('/inventory/stock-report')}>
                    Back to Reports
                </Button>
            </div>

            <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px' }}>
                    <div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                            <FormSelect
                                label="Branch"
                                name="branch_id"
                                value={formData.branch_id.toString()}
                                onChange={(value) => setFormData({ ...formData, branch_id: parseInt(value) })}
                                options={branches.map((b) => ({ value: b.id.toString(), label: b.name || `Branch ${b.id}` }))}
                                required
                            />
                            <FormSelect
                                label="Adjustment Type"
                                name="adjustment_type"
                                value={formData.adjustment_type}
                                onChange={(value) => {
                                    setFormData({ ...formData, adjustment_type: value as 'increase' | 'decrease' });
                                    // Recalculate new quantities
                                    setLineItems((items) =>
                                        items.map((item) => ({
                                            ...item,
                                            new_quantity:
                                                value === 'increase'
                                                    ? item.current_quantity + item.adjustment_quantity
                                                    : Math.max(0, item.current_quantity - item.adjustment_quantity),
                                        }))
                                    );
                                }}
                                options={[
                                    { value: 'increase', label: 'Increase' },
                                    { value: 'decrease', label: 'Decrease' },
                                ]}
                                required
                            />
                            <FormDatePicker
                                label="Adjustment Date"
                                name="adjustment_date"
                                value={formData.adjustment_date}
                                onChange={(value) => setFormData({ ...formData, adjustment_date: value || new Date() })}
                                required
                            />
                        </div>

                        <FormInput
                            label="Reason"
                            name="reason"
                            value={formData.reason}
                            onChange={(value) => setFormData({ ...formData, reason: value })}
                            required
                            error={errors.reason}
                            helpText="Explain why this adjustment is needed"
                        />

                        <FormTextarea
                            label="Notes"
                            name="notes"
                            value={formData.notes}
                            onChange={(value) => setFormData({ ...formData, notes: value })}
                            rows={3}
                        />
                    </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h2>Adjustment Items</h2>
                        <Button variant="outline" onClick={handleAddLineItem} icon={<Add24Regular />}>
                            Add Item
                        </Button>
                    </div>

                    {lineItems.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '48px', background: '#f5f5f5', borderRadius: '4px' }}>
                            <p>No items added. Click "Add Item" to start.</p>
                        </div>
                    ) : (
                        <div style={{ border: '1px solid #e1e1e1', borderRadius: '4px', overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ background: '#f5f5f5' }}>
                                    <tr>
                                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Product</th>
                                        <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>Current Qty</th>
                                        <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>
                                            {formData.adjustment_type === 'increase' ? 'Increase' : 'Decrease'} Qty
                                        </th>
                                        <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>New Qty</th>
                                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Reason</th>
                                        <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600 }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lineItems.map((item, index) => (
                                        <tr key={index} style={{ borderTop: '1px solid #f5f5f5' }}>
                                            <td style={{ padding: '12px' }}>
                                                <SearchableDropdown
                                                    label=""
                                                    placeholder="Select product..."
                                                    value={products.find((p) => p.id === item.product_id) || null}
                                                    onChange={(p) => handleProductSelect(p, index)}
                                                    getItems={async (search) => {
                                                        const filtered = products.filter(
                                                            (p) =>
                                                                p.name?.toLowerCase().includes(search.toLowerCase()) ||
                                                                p.product_code?.toLowerCase().includes(search.toLowerCase())
                                                        );
                                                        return filtered.map((p) => ({
                                                            value: p.id,
                                                            label: `${p.product_code} - ${p.name}`,
                                                            data: p,
                                                        }));
                                                    }}
                                                />
                                                {errors[`item_${index}`] && (
                                                    <div style={{ color: '#d13438', fontSize: '12px', marginTop: '4px' }}>
                                                        {errors[`item_${index}`]}
                                                    </div>
                                                )}
                                            </td>
                                            <td style={{ padding: '12px', textAlign: 'right' }}>{item.current_quantity}</td>
                                            <td style={{ padding: '12px' }}>
                                                <FormNumberInput
                                                    label=""
                                                    name={`adj_qty_${index}`}
                                                    value={item.adjustment_quantity}
                                                    onChange={(value) => handleQuantityChange(index, value || 0)}
                                                    min={0}
                                                    step={1}
                                                />
                                                {errors[`qty_${index}`] && (
                                                    <div style={{ color: '#d13438', fontSize: '12px', marginTop: '4px' }}>
                                                        {errors[`qty_${index}`]}
                                                    </div>
                                                )}
                                            </td>
                                            <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>
                                                {item.new_quantity}
                                            </td>
                                            <td style={{ padding: '12px' }}>
                                                <FormInput
                                                    label=""
                                                    name={`reason_${index}`}
                                                    value={item.reason || ''}
                                                    onChange={(value) => {
                                                        const updated = [...lineItems];
                                                        updated[index].reason = value;
                                                        setLineItems(updated);
                                                    }}
                                                    placeholder="Optional item reason"
                                                />
                                            </td>
                                            <td style={{ padding: '12px', textAlign: 'center' }}>
                                                <Button
                                                    size="small"
                                                    variant="outline"
                                                    onClick={() => handleRemoveItem(index)}
                                                    icon={<Dismiss24Regular />}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <Button variant="outline" onClick={() => navigate('/inventory/stock-report')} disabled={loading}>
                        Cancel
                    </Button>
                    <Button type="submit" variant="primary" loading={loading}>
                        Create Adjustment
                    </Button>
                </div>
            </form>
        </div>
    );
}
