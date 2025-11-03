import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../renderer/components/ui/Button';
import { FormSelect, DataGrid, LoadingSpinner } from '../../../shared/components';
import InventoryService from '../services/InventoryService';
import ProductService from '../services/ProductService';
import type { Branch } from '../../../shared/types/entities';
import { formatCurrency } from '../../../shared/utils/formatting';
import { useToastController, useId } from '@fluentui/react-components';
import { ArrowDownload24Regular } from '@fluentui/react-icons';

interface ValuationItem {
  product_id: number;
  product_code?: string;
  product_name: string;
  quantity_on_hand: number;
  average_cost: number;
  last_cost: number;
  stock_value_avg: number;
  stock_value_last: number;
  valuation_method: 'average' | 'last';
}

export default function ValuationPage() {
  const navigate = useNavigate();
  const toasterId = useId('toaster');
  const { dispatchToast } = useToastController(toasterId);

  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [valuationData, setValuationData] = useState<ValuationItem[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<number>(1);
  const [valuationMethod, setValuationMethod] = useState<'average' | 'last'>('average');

  useEffect(() => {
    loadBranches();
  }, []);

  useEffect(() => {
    if (selectedBranch) {
      loadValuationData();
    }
  }, [selectedBranch, valuationMethod]);

  const loadBranches = async () => {
    try {
      const allBranches = await InventoryService.getBranches();
      setBranches(allBranches);
      if (allBranches.length > 0) {
        setSelectedBranch(allBranches[0].id);
      }
    } catch (error) {
      dispatchToast(<div>Failed to load branches: {(error as Error).message}</div>, {
        intent: 'error',
      });
    }
  };

  const loadValuationData = async () => {
    try {
      setLoading(true);
      const productsWithStock = await InventoryService.getProductsWithStock(selectedBranch);

      const valuation: ValuationItem[] = productsWithStock
        .filter((p) => p.stock && p.stock.quantity_on_hand > 0)
        .map((p) => {
          const stock = p.stock!;
          const avgCost = stock.average_cost || p.cost_price || 0;
          const lastCost = stock.last_cost || p.cost_price || 0;
          const qty = stock.quantity_on_hand || 0;

          return {
            product_id: p.id,
            product_code: p.product_code,
            product_name: p.name || '',
            quantity_on_hand: qty,
            average_cost: avgCost,
            last_cost: lastCost,
            stock_value_avg: qty * avgCost,
            stock_value_last: qty * lastCost,
            valuation_method: valuationMethod,
          };
        });

      setValuationData(valuation);
    } catch (error) {
      dispatchToast(<div>Failed to load valuation data: {(error as Error).message}</div>, {
        intent: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const rows = valuationData.map((item) => ({
      'Product Code': item.product_code || '',
      'Product Name': item.product_name,
      Quantity: item.quantity_on_hand,
      'Average Cost': item.average_cost,
      'Last Cost': item.last_cost,
      'Stock Value (Avg)': item.stock_value_avg,
      'Stock Value (Last)': item.stock_value_last,
      'Selected Value':
        valuationMethod === 'average' ? item.stock_value_avg : item.stock_value_last,
    }));

    const headers = Object.keys(rows[0] || {});
    const csv = [
      headers.join(','),
      ...rows.map((row) =>
        headers
          .map((h) => `"${String(row[h as keyof typeof row] || '').replace(/"/g, '""')}"`)
          .join(','),
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory_valuation_${selectedBranch}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    dispatchToast(<div>Valuation report exported successfully</div>, { intent: 'success' });
  };

  const getTotalValue = () => {
    return valuationData.reduce((sum, item) => {
      return sum + (valuationMethod === 'average' ? item.stock_value_avg : item.stock_value_last);
    }, 0);
  };

  const columns = [
    { key: 'product_code', header: 'Code', sortable: true, width: '120px' },
    { key: 'product_name', header: 'Product', sortable: true },
    {
      key: 'quantity_on_hand',
      header: 'Quantity',
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
      key: 'last_cost',
      header: 'Last Cost',
      sortable: true,
      align: 'right' as const,
      render: (value: number) => formatCurrency(value),
    },
    {
      key: 'stock_value_avg',
      header: 'Value (Avg)',
      sortable: true,
      align: 'right' as const,
      render: (value: number, row: ValuationItem) => (
        <span
          style={{
            fontWeight: valuationMethod === 'average' ? 600 : 400,
            color: valuationMethod === 'average' ? '#0078d4' : '#616161',
          }}
        >
          {formatCurrency(value)}
        </span>
      ),
    },
    {
      key: 'stock_value_last',
      header: 'Value (Last)',
      sortable: true,
      align: 'right' as const,
      render: (value: number, row: ValuationItem) => (
        <span
          style={{
            fontWeight: valuationMethod === 'last' ? 600 : 400,
            color: valuationMethod === 'last' ? '#0078d4' : '#616161',
          }}
        >
          {formatCurrency(value)}
        </span>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        <h1>Inventory Valuation</h1>
        <Button variant="outline" onClick={() => navigate('/inventory/product-list')}>
          Back to Products
        </Button>
      </div>

      <div
        style={{
          background: '#f5f5f5',
          padding: '24px',
          borderRadius: '8px',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            marginBottom: '16px',
          }}
        >
          <FormSelect
            label="Branch"
            name="branch_id"
            value={selectedBranch.toString()}
            onChange={(value) => setSelectedBranch(parseInt(value))}
            options={branches.map((b) => ({
              value: b.id.toString(),
              label: b.name || `Branch ${b.id}`,
            }))}
          />
          <FormSelect
            label="Valuation Method"
            name="valuation_method"
            value={valuationMethod}
            onChange={(value) => setValuationMethod(value as 'average' | 'last')}
            options={[
              { value: 'average', label: 'Average Cost' },
              { value: 'last', label: 'Last Cost' },
            ]}
          />
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '16px',
          }}
        >
          <div style={{ fontSize: '18px', fontWeight: 600 }}>
            Total Inventory Value:{' '}
            <span style={{ color: '#0078d4', fontSize: '24px' }}>
              {formatCurrency(getTotalValue())}
            </span>
          </div>
          <Button variant="primary" onClick={handleExport} icon={<ArrowDownload24Regular />}>
            Export CSV
          </Button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner variant="page" />
      ) : (
        <>
          <div style={{ marginBottom: '16px', color: '#616161', fontSize: '14px' }}>
            <strong>Valuation Method:</strong>{' '}
            {valuationMethod === 'average' ? 'Average Cost' : 'Last Cost'}
            {' | '}
            <strong>Total Products:</strong> {valuationData.length}
          </div>
          <DataGrid columns={columns} data={valuationData} searchable />
        </>
      )}
    </div>
  );
}
