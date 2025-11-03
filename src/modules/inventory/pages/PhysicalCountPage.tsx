import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../renderer/components/ui/Button';
import {
  FormSelect,
  FormDatePicker,
  FormNumberInput,
  SearchableDropdown,
  DataGrid,
} from '../../../shared/components';
import InventoryService from '../services/InventoryService';
import ProductService from '../services/ProductService';
import type { Product, Branch, InventoryStock } from '../../../shared/types/entities';
import { formatCurrency } from '../../../shared/utils/formatting';
import { useToastController, useId } from '@fluentui/react-components';
import { Save24Regular } from '@fluentui/react-icons';

interface CountItem {
  product_id: number;
  product_name: string;
  product_code?: string;
  system_quantity: number;
  counted_quantity: number;
  variance: number;
}

export default function PhysicalCountPage() {
  const navigate = useNavigate();
  const toasterId = useId('toaster');
  const { dispatchToast } = useToastController(toasterId);

  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [countItems, setCountItems] = useState<CountItem[]>([]);
  const [formData, setFormData] = useState({
    branch_id: 1,
    count_date: new Date(),
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (formData.branch_id) {
      loadProductsForCount();
    }
  }, [formData.branch_id]);

  const loadData = async () => {
    try {
      const [allBranches, allProducts] = await Promise.all([
        InventoryService.getBranches(),
        ProductService.getProducts({ product_type: 'physical' }),
      ]);
      // Filter products with inventory tracking enabled
      const productsWithInventory = allProducts.filter((p) => p.track_inventory);
      setProducts(productsWithInventory);
      setBranches(allBranches);
      if (allBranches.length > 0 && !formData.branch_id) {
        setFormData((prev) => ({ ...prev, branch_id: allBranches[0].id }));
      }
    } catch (error) {
      dispatchToast(<div>Failed to load data: {(error as Error).message}</div>, {
        intent: 'error',
      });
    }
  };

  const loadProductsForCount = async () => {
    try {
      const productsWithStock = await InventoryService.getProductsWithStock(formData.branch_id);
      const items: CountItem[] = productsWithStock.map((p) => ({
        product_id: p.id,
        product_name: p.name || '',
        product_code: p.product_code,
        system_quantity: p.stock?.quantity_on_hand || 0,
        counted_quantity: p.stock?.quantity_on_hand || 0,
        variance: 0,
      }));
      setCountItems(items);
    } catch (error) {
      dispatchToast(<div>Failed to load stock: {(error as Error).message}</div>, {
        intent: 'error',
      });
    }
  };

  const handleQuantityChange = (index: number, value: number) => {
    const updated = [...countItems];
    updated[index].counted_quantity = Math.max(0, value);
    updated[index].variance = updated[index].counted_quantity - updated[index].system_quantity;
    setCountItems(updated);
  };

  const handleSaveCount = async () => {
    try {
      setLoading(true);

      // Create stock adjustments for variances
      const variances = countItems.filter((item) => item.variance !== 0);
      if (variances.length === 0) {
        dispatchToast(<div>No variances found. All quantities match system values.</div>, {
          intent: 'info',
        });
        return;
      }

      // Group by adjustment type
      const increases = variances.filter((v) => v.variance > 0);
      const decreases = variances.filter((v) => v.variance < 0);

      // Create increase adjustment if needed
      if (increases.length > 0) {
        await InventoryService.createStockAdjustment({
          branch_id: formData.branch_id,
          adjustment_date: formData.count_date.toISOString().split('T')[0],
          adjustment_type: 'increase',
          reason: 'Physical count - variance correction (increase)',
          notes: 'Physical inventory count adjustment',
          items: increases.map((item) => ({
            product_id: item.product_id,
            current_quantity: item.system_quantity,
            adjustment_quantity: item.variance,
            reason: `Physical count: ${item.system_quantity} → ${item.counted_quantity}`,
          })),
        });
      }

      // Create decrease adjustment if needed
      if (decreases.length > 0) {
        await InventoryService.createStockAdjustment({
          branch_id: formData.branch_id,
          adjustment_date: formData.count_date.toISOString().split('T')[0],
          adjustment_type: 'decrease',
          reason: 'Physical count - variance correction (decrease)',
          notes: 'Physical inventory count adjustment',
          items: decreases.map((item) => ({
            product_id: item.product_id,
            current_quantity: item.system_quantity,
            adjustment_quantity: Math.abs(item.variance),
            reason: `Physical count: ${item.system_quantity} → ${item.counted_quantity}`,
          })),
        });
      }

      dispatchToast(
        <div>
          Physical count saved. Created adjustments for {variances.length} products with variances.
        </div>,
        { intent: 'success' },
      );

      loadProductsForCount();
    } catch (error) {
      dispatchToast(<div>Failed to save count: {(error as Error).message}</div>, {
        intent: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: 'product_code', header: 'Code', sortable: true, width: '120px' },
    { key: 'product_name', header: 'Product', sortable: true },
    {
      key: 'system_quantity',
      header: 'System Qty',
      sortable: true,
      align: 'right' as const,
      render: (value: number) => value.toLocaleString(),
    },
    {
      key: 'counted_quantity',
      header: 'Counted Qty',
      sortable: false,
      align: 'right' as const,
      render: (value: number, row: CountItem) => {
        const index = countItems.findIndex((item) => item.product_id === row.product_id);
        return (
          <FormNumberInput
            label=""
            name={`counted_${index}`}
            value={value}
            onChange={(val) => handleQuantityChange(index, val || 0)}
            min={0}
            step={1}
          />
        );
      },
    },
    {
      key: 'variance',
      header: 'Variance',
      sortable: true,
      align: 'right' as const,
      render: (value: number) => (
        <span
          style={{
            color: value === 0 ? '#616161' : value > 0 ? '#107c10' : '#d13438',
            fontWeight: value !== 0 ? 600 : 400,
          }}
        >
          {value > 0 ? '+' : ''}
          {value.toLocaleString()}
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
        <h1>Physical Inventory Count</h1>
        <Button variant="outline" onClick={() => navigate('/inventory/stock-report')}>
          Back to Reports
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <FormSelect
            label="Branch"
            name="branch_id"
            value={formData.branch_id?.toString() || '1'}
            onChange={(value) => {
              if (value && typeof value === 'string') {
                setFormData({ ...formData, branch_id: parseInt(value) });
              }
            }}
            options={branches.map((b) => ({
              value: b.id.toString(),
              label: b.name || `Branch ${b.id}`,
            }))}
            required
          />
          <FormDatePicker
            label="Count Date"
            name="count_date"
            value={formData.count_date}
            onChange={(value) => setFormData({ ...formData, count_date: value || new Date() })}
            required
          />
        </div>

        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="primary"
            onClick={handleSaveCount}
            loading={loading}
            icon={<Save24Regular />}
          >
            Save Count & Create Adjustments
          </Button>
        </div>
      </div>

      <div
        style={{
          marginBottom: '16px',
          padding: '16px',
          background: '#e8f4f8',
          borderRadius: '4px',
        }}
      >
        <p style={{ margin: 0, fontSize: '14px' }}>
          <strong>Instructions:</strong> Compare the system quantity with the physical count. Enter
          the counted quantity in the "Counted Qty" column. Variances will be automatically
          calculated. Click "Save Count" to create stock adjustments for all variances.
        </p>
      </div>

      {countItems.length > 0 ? (
        <>
          <div
            style={{
              marginBottom: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <strong>Total Products:</strong> {countItems.length} | <strong>With Variance:</strong>{' '}
              <span style={{ color: '#d13438' }}>
                {countItems.filter((i) => i.variance !== 0).length}
              </span>
            </div>
          </div>
          <DataGrid columns={columns} data={countItems} searchable />
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '48px', color: '#616161' }}>
          <p>
            No products found for this branch. Make sure inventory tracking is enabled for products.
          </p>
        </div>
      )}
    </div>
  );
}
