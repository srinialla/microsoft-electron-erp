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
    DataGrid,
} from '../../../shared/components';
import InventoryService from '../services/InventoryService';
import ProductService from '../services/ProductService';
import type { Product, Branch, StockTransfer } from '../../../shared/types/entities';
import { formatDate } from '../../../shared/utils/formatting';
import { useToastController, useId } from '@fluentui/react-components';
import { Add24Regular, Dismiss24Regular, Checkmark24Regular } from '@fluentui/react-icons';

interface TransferItem {
    product_id?: number;
    product_name?: string;
    quantity: number;
}

export default function StockTransferPage() {
    const navigate = useNavigate();
    const toasterId = useId('toaster');
    const { dispatchToast } = useToastController(toasterId);

    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [transfers, setTransfers] = useState<StockTransfer[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        from_branch_id: 1,
        to_branch_id: 2,
        transfer_date: new Date(),
        notes: '',
    });
    const [lineItems, setLineItems] = useState<TransferItem[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        loadData();
        loadTransfers();
    }, []);

    const loadData = async () => {
        try {
            const [allProducts, allBranches] = await Promise.all([
                ProductService.getProducts({ product_type: 'physical' }),
                InventoryService.getBranches(),
            ]);
            setProducts(allProducts);
            setBranches(allBranches);
        } catch (error) {
            dispatchToast(<div>Failed to load data: {(error as Error).message}</div>, { intent: 'error' });
        }
    };

    const loadTransfers = async () => {
        try {
            const allTransfers = await InventoryService.getStockTransfers();
            setTransfers(allTransfers);
        } catch (error) {
            dispatchToast(<div>Failed to load transfers: {(error as Error).message}</div>, { intent: 'error' });
        }
    };

    const handleAddLineItem = () => {
        setLineItems([
            ...lineItems,
            {
                quantity: 0,
            },
        ]);
    };

    const handleProductSelect = (product: Product | null, index: number) => {
        if (!product) return;

        const updated = [...lineItems];
        updated[index].product_id = product.id;
        updated[index].product_name = product.name || '';
        setLineItems(updated);
    };

    const handleQuantityChange = (index: number, value: number) => {
        const updated = [...lineItems];
        updated[index].quantity = Math.max(0, value);
        setLineItems(updated);
    };

    const handleRemoveItem = (index: number) => {
        setLineItems(lineItems.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.from_branch_id === formData.to_branch_id) {
            dispatchToast(<div>Source and destination branches must be different</div>, { intent: 'warning' });
            return;
        }

        if (lineItems.length === 0) {
            dispatchToast(<div>Please add at least one item</div>, { intent: 'warning' });
            return;
        }

        const validationErrors: Record<string, string> = {};
        lineItems.forEach((item, index) => {
            if (!item.product_id) {
                validationErrors[`item_${index}`] = 'Product is required';
            }
            if (item.quantity <= 0) {
                validationErrors[`qty_${index}`] = 'Quantity must be greater than 0';
            }
        });

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        try {
            setLoading(true);

            await InventoryService.createStockTransfer({
                from_branch_id: formData.from_branch_id,
                to_branch_id: formData.to_branch_id,
                transfer_date: formData.transfer_date.toISOString().split('T')[0],
                notes: formData.notes,
                items: lineItems.map((item) => ({
                    product_id: item.product_id!,
                    quantity: item.quantity,
                })),
            });

            dispatchToast(<div>Stock transfer created successfully</div>, { intent: 'success' });
            setShowForm(false);
            setLineItems([]);
            setFormData({ ...formData, notes: '' });
            loadTransfers();
        } catch (error) {
            dispatchToast(<div>Failed to create transfer: {(error as Error).message}</div>, { intent: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleReceiveTransfer = async (transferId: number) => {
        try {
            setLoading(true);
            await InventoryService.receiveStockTransfer(transferId);
            dispatchToast(<div>Transfer received successfully</div>, { intent: 'success' });
            loadTransfers();
        } catch (error) {
            dispatchToast(<div>Failed to receive transfer: {(error as Error).message}</div>, { intent: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const getBranchName = (branchId: number) => {
        const branch = branches.find((b) => b.id === branchId);
        return branch ? branch.name || `Branch ${branchId}` : `Branch ${branchId}`;
    };

    const columns = [
        { key: 'transfer_number', header: 'Transfer #', sortable: true, width: '150px' },
        {
            key: 'from_branch_id',
            header: 'From Branch',
            sortable: true,
            render: (value: number) => getBranchName(value),
        },
        {
            key: 'to_branch_id',
            header: 'To Branch',
            sortable: true,
            render: (value: number) => getBranchName(value),
        },
        {
            key: 'transfer_date',
            header: 'Transfer Date',
            sortable: true,
            render: (value: string) => formatDate(value),
        },
        {
            key: 'status',
            header: 'Status',
            sortable: true,
            render: (value: string) => (
                <span
                    style={{
                        textTransform: 'capitalize',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        background:
                            value === 'received'
                                ? '#d4edda'
                                : value === 'pending'
                                ? '#fff3cd'
                                : value === 'in_transit'
                                ? '#cfe2ff'
                                : '#f8d7da',
                        color:
                            value === 'received'
                                ? '#155724'
                                : value === 'pending'
                                ? '#856404'
                                : value === 'in_transit'
                                ? '#084298'
                                : '#721c24',
                    }}
                >
                    {value}
                </span>
            ),
        },
        {
            key: 'actions',
            header: 'Actions',
            render: (_: any, row: StockTransfer) => (
                <Button
                    size="small"
                    variant="primary"
                    onClick={() => handleReceiveTransfer(row.id)}
                    disabled={row.status !== 'pending'}
                    icon={<Checkmark24Regular />}
                >
                    Receive
                </Button>
            ),
        },
    ];

    return (
        <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h1>Stock Transfers</h1>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <Button variant="outline" onClick={() => navigate('/inventory/stock-report')}>
                        Back to Reports
                    </Button>
                    <Button variant="primary" onClick={() => setShowForm(!showForm)}>
                        {showForm ? 'Hide Form' : 'New Transfer'}
                    </Button>
                </div>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} style={{ background: '#f5f5f5', padding: '24px', borderRadius: '8px', marginBottom: '24px' }}>
                    <h2 style={{ marginTop: 0 }}>Create Stock Transfer</h2>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                        <FormSelect
                            label="From Branch"
                            name="from_branch_id"
                            value={formData.from_branch_id.toString()}
                            onChange={(value) => setFormData({ ...formData, from_branch_id: parseInt(value) })}
                            options={branches.map((b) => ({ value: b.id.toString(), label: b.name || `Branch ${b.id}` }))}
                            required
                        />
                        <FormSelect
                            label="To Branch"
                            name="to_branch_id"
                            value={formData.to_branch_id.toString()}
                            onChange={(value) => setFormData({ ...formData, to_branch_id: parseInt(value) })}
                            options={branches
                                .filter((b) => b.id !== formData.from_branch_id)
                                .map((b) => ({ value: b.id.toString(), label: b.name || `Branch ${b.id}` }))}
                            required
                        />
                        <FormDatePicker
                            label="Transfer Date"
                            name="transfer_date"
                            value={formData.transfer_date}
                            onChange={(value) => setFormData({ ...formData, transfer_date: value || new Date() })}
                            required
                        />
                    </div>

                    <FormTextarea label="Notes" name="notes" value={formData.notes} onChange={(value) => setFormData({ ...formData, notes: value })} rows={3} />

                    <div style={{ marginTop: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3>Transfer Items</h3>
                            <Button variant="outline" onClick={handleAddLineItem} icon={<Add24Regular />}>
                                Add Item
                            </Button>
                        </div>

                        {lineItems.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '24px', background: '#fff', borderRadius: '4px' }}>
                                <p>No items added. Click "Add Item" to start.</p>
                            </div>
                        ) : (
                            <div style={{ border: '1px solid #e1e1e1', borderRadius: '4px', overflow: 'hidden', background: '#fff' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead style={{ background: '#f5f5f5' }}>
                                        <tr>
                                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Product</th>
                                            <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>Quantity</th>
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
                                                <td style={{ padding: '12px' }}>
                                                    <FormNumberInput
                                                        label=""
                                                        name={`qty_${index}`}
                                                        value={item.quantity}
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

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                        <Button variant="outline" onClick={() => setShowForm(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" loading={loading}>
                            Create Transfer
                        </Button>
                    </div>
                </form>
            )}

            <DataGrid columns={columns} data={transfers} searchable />
        </div>
    );
}
