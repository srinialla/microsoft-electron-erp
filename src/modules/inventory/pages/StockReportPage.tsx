import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../renderer/components/ui/Button';
import { FormSelect, DataGrid } from '../../../shared/components';
import InventoryService from '../services/InventoryService';
import ProductService from '../services/ProductService';
import type { Branch } from '../../../shared/types/entities';
import { formatCurrency } from '../../../shared/utils/formatting';
import { useToastController, useId } from '@fluentui/react-components';
import { ArrowDownload24Regular } from '@fluentui/react-icons';

interface StockReportItem {
    product_id: number;
    product_code?: string;
    product_name: string;
    quantity_on_hand: number;
    quantity_reserved: number;
    quantity_available: number;
    average_cost: number;
    stock_value: number;
    reorder_level?: number;
    status: 'in_stock' | 'low_stock' | 'out_of_stock';
}

export default function StockReportPage() {
    const navigate = useNavigate();
    const toasterId = useId('toaster');
    const { dispatchToast } = useToastController(toasterId);

    const [loading, setLoading] = useState(false);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [reportData, setReportData] = useState<StockReportItem[]>([]);
    const [filteredData, setFilteredData] = useState<StockReportItem[]>([]);
    const [selectedBranch, setSelectedBranch] = useState<number>(1);
    const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');

    useEffect(() => {
        loadBranches();
    }, []);

    useEffect(() => {
        if (selectedBranch) {
            loadStockReport();
        }
    }, [selectedBranch]);

    useEffect(() => {
        applyFilters();
    }, [reportData, stockFilter]);

    const loadBranches = async () => {
        try {
            const allBranches = await InventoryService.getBranches();
            setBranches(allBranches);
            if (allBranches.length > 0) {
                setSelectedBranch(allBranches[0].id);
            }
        } catch (error) {
            dispatchToast(<div>Failed to load branches: {(error as Error).message}</div>, { intent: 'error' });
        }
    };

    const loadStockReport = async () => {
        try {
            setLoading(true);
            const productsWithStock = await InventoryService.getProductsWithStock(selectedBranch);

            const report: StockReportItem[] = productsWithStock.map((p) => {
                const stock = p.stock;
                const quantityOnHand = stock?.quantity_on_hand || 0;
                const quantityReserved = stock?.quantity_reserved || 0;
                const quantityAvailable = stock?.quantity_available || 0;
                const averageCost = stock?.average_cost || p.cost_price || 0;
                const stockValue = quantityOnHand * averageCost;
                const reorderLevel = stock?.reorder_level || p.reorder_level || 0;

                let status: 'in_stock' | 'low_stock' | 'out_of_stock' = 'in_stock';
                if (quantityOnHand === 0) {
                    status = 'out_of_stock';
                } else if (reorderLevel > 0 && quantityOnHand <= reorderLevel) {
                    status = 'low_stock';
                }

                return {
                    product_id: p.id,
                    product_code: p.product_code,
                    product_name: p.name || '',
                    quantity_on_hand: quantityOnHand,
                    quantity_reserved: quantityReserved,
                    quantity_available: quantityAvailable,
                    average_cost: averageCost,
                    stock_value: stockValue,
                    reorder_level: reorderLevel,
                    status,
                };
            });

            setReportData(report);
        } catch (error) {
            dispatchToast(<div>Failed to load stock report: {(error as Error).message}</div>, { intent: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...reportData];

        if (stockFilter !== 'all') {
            filtered = filtered.filter((item) => item.status === stockFilter);
        }

        setFilteredData(filtered);
    };

    const handleExport = () => {
        // Simple CSV export
        const headers = ['Product Code', 'Product Name', 'On Hand', 'Reserved', 'Available', 'Avg Cost', 'Stock Value', 'Status'];
        const rows = filteredData.map((item) => [
            item.product_code || '',
            item.product_name,
            item.quantity_on_hand.toString(),
            item.quantity_reserved.toString(),
            item.quantity_available.toString(),
            item.average_cost.toFixed(2),
            item.stock_value.toFixed(2),
            item.status,
        ]);

        const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `stock_report_${selectedBranch}_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);

        dispatchToast(<div>Stock report exported successfully</div>, { intent: 'success' });
    };

    const getTotalStockValue = () => {
        return filteredData.reduce((sum, item) => sum + item.stock_value, 0);
    };

    const getStatusCount = (status: 'in_stock' | 'low_stock' | 'out_of_stock') => {
        return reportData.filter((item) => item.status === status).length;
    };

    const columns = [
        { key: 'product_code', header: 'Code', sortable: true, width: '120px' },
        { key: 'product_name', header: 'Product', sortable: true },
        {
            key: 'quantity_on_hand',
            header: 'On Hand',
            sortable: true,
            align: 'right' as const,
            render: (value: number) => value.toLocaleString(),
        },
        {
            key: 'quantity_reserved',
            header: 'Reserved',
            sortable: true,
            align: 'right' as const,
            render: (value: number) => value.toLocaleString(),
        },
        {
            key: 'quantity_available',
            header: 'Available',
            sortable: true,
            align: 'right' as const,
            render: (value: number) => value.toLocaleString(),
        },
        {
            key: 'average_cost',
            header: 'Avg Cost',
            sortable: true,
            align: 'right' as const,
            render: (value: number) => formatCurrency(value),
        },
        {
            key: 'stock_value',
            header: 'Stock Value',
            sortable: true,
            align: 'right' as const,
            render: (value: number) => formatCurrency(value),
        },
        {
            key: 'reorder_level',
            header: 'Reorder Level',
            sortable: true,
            align: 'right' as const,
            render: (value: number | undefined) => (value ? value.toLocaleString() : '-'),
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
                            value === 'in_stock'
                                ? '#d4edda'
                                : value === 'low_stock'
                                ? '#fff3cd'
                                : '#f8d7da',
                        color:
                            value === 'in_stock'
                                ? '#155724'
                                : value === 'low_stock'
                                ? '#856404'
                                : '#721c24',
                    }}
                >
                    {value.replace('_', ' ')}
                </span>
            ),
        },
    ];

    return (
        <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h1>Stock Report</h1>
                <Button variant="outline" onClick={() => navigate('/inventory/product-list')}>
                    Back to Products
                </Button>
            </div>

            <div style={{ background: '#f5f5f5', padding: '24px', borderRadius: '8px', marginBottom: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <FormSelect
                        label="Branch"
                        name="branch_id"
                        value={selectedBranch.toString()}
                        onChange={(value) => setSelectedBranch(parseInt(value))}
                        options={branches.map((b) => ({ value: b.id.toString(), label: b.name || `Branch ${b.id}` }))}
                    />
                    <FormSelect
                        label="Stock Status Filter"
                        name="stockFilter"
                        value={stockFilter}
                        onChange={(value) => setStockFilter(value as any)}
                        options={[
                            { value: 'all', label: 'All' },
                            { value: 'in_stock', label: 'In Stock' },
                            { value: 'low_stock', label: 'Low Stock' },
                            { value: 'out_of_stock', label: 'Out of Stock' },
                        ]}
                    />
                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                        <Button variant="primary" onClick={handleExport} icon={<ArrowDownload24Regular />}>
                            Export CSV
                        </Button>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginTop: '16px' }}>
                    <div style={{ background: '#fff', padding: '16px', borderRadius: '4px' }}>
                        <div style={{ fontSize: '24px', fontWeight: 600, color: '#107c10' }}>
                            {getStatusCount('in_stock')}
                        </div>
                        <div style={{ fontSize: '14px', color: '#616161' }}>In Stock</div>
                    </div>
                    <div style={{ background: '#fff', padding: '16px', borderRadius: '4px' }}>
                        <div style={{ fontSize: '24px', fontWeight: 600, color: '#ff8c00' }}>
                            {getStatusCount('low_stock')}
                        </div>
                        <div style={{ fontSize: '14px', color: '#616161' }}>Low Stock</div>
                    </div>
                    <div style={{ background: '#fff', padding: '16px', borderRadius: '4px' }}>
                        <div style={{ fontSize: '24px', fontWeight: 600, color: '#d13438' }}>
                            {getStatusCount('out_of_stock')}
                        </div>
                        <div style={{ fontSize: '14px', color: '#616161' }}>Out of Stock</div>
                    </div>
                    <div style={{ background: '#fff', padding: '16px', borderRadius: '4px' }}>
                        <div style={{ fontSize: '24px', fontWeight: 600, color: '#0078d4' }}>
                            {formatCurrency(getTotalStockValue())}
                        </div>
                        <div style={{ fontSize: '14px', color: '#616161' }}>Total Stock Value</div>
                    </div>
                </div>
            </div>

            <DataGrid columns={columns} data={filteredData} loading={loading} searchable exportable />
        </div>
    );
}
