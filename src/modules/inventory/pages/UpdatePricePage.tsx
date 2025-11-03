import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../renderer/components/ui/Button';
import { FormCurrency, SearchableDropdown, DataGrid } from '../../../shared/components';
import ProductService from '../services/ProductService';
import type { Product } from '../../../shared/types/entities';
import { formatCurrency } from '../../../shared/utils/formatting';
import { useToastController, useId } from '@fluentui/react-components';
import { Save24Regular } from '@fluentui/react-icons';

interface PriceUpdate {
  product_id: number;
  product_name: string;
  cost_price: number;
  selling_price: number;
  mrp?: number;
  wholesale_price?: number;
}

export default function UpdatePricePage() {
  const navigate = useNavigate();
  const toasterId = useId('toaster');
  const { dispatchToast } = useToastController(toasterId);

  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [priceUpdates, setPriceUpdates] = useState<PriceUpdate[]>([]);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const allProducts = await ProductService.getProducts();
      setProducts(allProducts);
    } catch (error) {
      dispatchToast(<div>Failed to load products: {(error as Error).message}</div>, {
        intent: 'error',
      });
    }
  };

  const handleAddProduct = (productId: number | undefined) => {
    if (!productId) return;

    const product = products.find((p) => p.id === productId);
    if (!product) return;

    // Check if already added
    if (priceUpdates.some((p) => p.product_id === product.id)) {
      dispatchToast(<div>Product already added</div>, { intent: 'warning' });
      return;
    }

    setPriceUpdates([
      ...priceUpdates,
      {
        product_id: product.id,
        product_name: product.name || '',
        cost_price: product.cost_price || 0,
        selling_price: product.selling_price || 0,
        mrp: product.mrp,
        wholesale_price: product.wholesale_price,
      },
    ]);
    setSelectedProduct(null);
  };

  const handleUpdatePrice = (
    index: number,
    field: keyof PriceUpdate,
    value: number | undefined,
  ) => {
    const updated = [...priceUpdates];
    updated[index] = { ...updated[index], [field]: value };
    setPriceUpdates(updated);
  };

  const handleRemove = (index: number) => {
    setPriceUpdates(priceUpdates.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (priceUpdates.length === 0) {
      dispatchToast(<div>Please add products to update</div>, { intent: 'warning' });
      return;
    }

    try {
      setLoading(true);

      const updates = priceUpdates.map((p) => ({
        product_id: p.product_id,
        cost_price: p.cost_price,
        selling_price: p.selling_price,
        mrp: p.mrp,
        wholesale_price: p.wholesale_price,
      }));

      // Use bulk update if available, otherwise update one by one
      let updated = 0;
      for (const update of updates) {
        if (update.product_id) {
          await ProductService.updateProductPrice(update.product_id, {
            cost_price: update.cost_price,
            selling_price: update.selling_price,
            mrp: update.mrp,
            wholesale_price: update.wholesale_price,
          });
          updated++;
        }
      }

      dispatchToast(<div>Successfully updated prices for {updated} products</div>, {
        intent: 'success',
      });
      setPriceUpdates([]);
      loadProducts();
    } catch (error) {
      dispatchToast(<div>Failed to update prices: {(error as Error).message}</div>, {
        intent: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpdate = async (
    field: 'cost_price' | 'selling_price',
    type: 'percentage' | 'fixed',
    value: number,
  ) => {
    if (priceUpdates.length === 0) {
      dispatchToast(<div>Please add products first</div>, { intent: 'warning' });
      return;
    }

    const updated = priceUpdates.map((p) => {
      let newValue = p[field];
      if (type === 'percentage') {
        newValue = p[field] * (1 + value / 100);
      } else {
        newValue = p[field] + value;
      }
      return { ...p, [field]: Math.max(0, newValue) };
    });

    setPriceUpdates(updated);
    dispatchToast(<div>Applied bulk update to {updated.length} products</div>, {
      intent: 'success',
    });
  };

  const columns = [
    { key: 'product_name', header: 'Product', sortable: true },
    {
      key: 'cost_price',
      header: 'Cost Price',
      sortable: true,
      align: 'right' as const,
      render: (value: number, row: PriceUpdate) => {
        const index = priceUpdates.findIndex((p) => p.product_id === row.product_id);
        return (
          <FormCurrency
            label=""
            name={`cost_${index}`}
            value={value}
            onChange={(val) => handleUpdatePrice(index, 'cost_price', val || 0)}
          />
        );
      },
    },
    {
      key: 'selling_price',
      header: 'Selling Price',
      sortable: true,
      align: 'right' as const,
      render: (value: number, row: PriceUpdate) => {
        const index = priceUpdates.findIndex((p) => p.product_id === row.product_id);
        return (
          <FormCurrency
            label=""
            name={`selling_${index}`}
            value={value}
            onChange={(val) => handleUpdatePrice(index, 'selling_price', val || 0)}
          />
        );
      },
    },
    {
      key: 'mrp',
      header: 'MRP',
      sortable: true,
      align: 'right' as const,
      render: (value: number | undefined, row: PriceUpdate) => {
        const index = priceUpdates.findIndex((p) => p.product_id === row.product_id);
        return (
          <FormCurrency
            label=""
            name={`mrp_${index}`}
            value={value}
            onChange={(val) => handleUpdatePrice(index, 'mrp', val ?? undefined)}
          />
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_: any, row: PriceUpdate) => {
        const index = priceUpdates.findIndex((p) => p.product_id === row.product_id);
        return (
          <Button size="small" variant="outline" onClick={() => handleRemove(index)}>
            Remove
          </Button>
        );
      },
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
        <h1>Update Product Prices</h1>
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
        <h3 style={{ marginTop: 0 }}>Add Products</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: '16px',
            alignItems: 'end',
          }}
        >
          <SearchableDropdown
            label="Select Product"
            name="selected_product"
            placeholder="Search and select product..."
            value={selectedProduct?.id}
            onChange={(value) => {
              const product = products.find((p) => p.id === value);
              setSelectedProduct(product || null);
              if (value) handleAddProduct(value);
            }}
            options={products.map((p) => ({
              value: p.id,
              label: `${p.product_code} - ${p.name}`,
              metadata: p,
            }))}
          />
        </div>

        {priceUpdates.length > 0 && (
          <div style={{ marginTop: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Button
              size="small"
              variant="outline"
              onClick={() => handleBulkUpdate('selling_price', 'percentage', 10)}
            >
              +10% Selling Price
            </Button>
            <Button
              size="small"
              variant="outline"
              onClick={() => handleBulkUpdate('selling_price', 'percentage', -10)}
            >
              -10% Selling Price
            </Button>
            <Button
              size="small"
              variant="outline"
              onClick={() => handleBulkUpdate('cost_price', 'percentage', 5)}
            >
              +5% Cost Price
            </Button>
            <Button
              size="small"
              variant="outline"
              onClick={() => handleBulkUpdate('cost_price', 'percentage', -5)}
            >
              -5% Cost Price
            </Button>
          </div>
        )}
      </div>

      {priceUpdates.length > 0 ? (
        <>
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="primary"
              onClick={handleSave}
              loading={loading}
              icon={<Save24Regular />}
            >
              Save All Changes
            </Button>
          </div>
          <DataGrid columns={columns} data={priceUpdates} searchable />
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '48px', color: '#616161' }}>
          <p>No products selected. Add products above to update their prices.</p>
        </div>
      )}
    </div>
  );
}
