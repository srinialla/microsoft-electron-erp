import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataGrid } from '../../../shared/components';
import { Button } from '../../../renderer/components/ui/Button';
import { ConfirmDialog } from '../../../shared/components';
import ProductService from '../services/ProductService';
import type { Product } from '../../../shared/types/entities';
import { StatusBadge } from '../../../shared/components';
import { formatCurrency } from '../../../shared/utils/formatting';
import { useToastController, useId } from '@fluentui/react-components';

export default function ProductListPage() {
  const navigate = useNavigate();
  const toasterId = useId('toaster');
  const { dispatchToast } = useToastController(toasterId);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; product: Product | null }>({
    open: false,
    product: null,
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await ProductService.getProducts();
      setProducts(data);
    } catch (error) {
      dispatchToast(<div>Failed to load products: {(error as Error).message}</div>, {
        intent: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (product: Product) => {
    try {
      await ProductService.deleteProduct(product.id);
      dispatchToast(<div>Product deleted successfully</div>, { intent: 'success' });
      loadProducts();
    } catch (error) {
      dispatchToast(<div>Failed to delete product: {(error as Error).message}</div>, {
        intent: 'error',
      });
    }
  };

  const columns = [
    {
      key: 'product_code',
      header: 'Code',
      sortable: true,
      width: '120px',
    },
    {
      key: 'name',
      header: 'Product Name',
      sortable: true,
      render: (value: string, row: Product) => (
        <div>
          <div style={{ fontWeight: 500 }}>{value}</div>
          {row.sku && <div style={{ fontSize: '12px', color: '#616161' }}>SKU: {row.sku}</div>}
        </div>
      ),
    },
    {
      key: 'category_id',
      header: 'Category',
      sortable: true,
      render: (value: number) => <span>{value ? `Category ${value}` : '-'}</span>,
    },
    {
      key: 'cost_price',
      header: 'Cost Price',
      sortable: true,
      align: 'right' as const,
      render: (value: number) => formatCurrency(value || 0),
    },
    {
      key: 'selling_price',
      header: 'Selling Price',
      sortable: true,
      align: 'right' as const,
      render: (value: number) => (
        <span style={{ fontWeight: 500, color: '#107c10' }}>{formatCurrency(value || 0)}</span>
      ),
    },
    {
      key: 'product_type',
      header: 'Type',
      sortable: true,
      render: (value: string) => <span style={{ textTransform: 'capitalize' }}>{value}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (value: string) => <StatusBadge status={value as any} />,
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        <h1>Products</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button variant="outline" onClick={() => navigate('/inventory/import')}>
            Import Products
          </Button>
          <Button variant="primary" onClick={() => navigate('/inventory/new-product')}>
            Add Product
          </Button>
        </div>
      </div>

      <DataGrid
        columns={columns}
        data={products}
        loading={loading}
        onRowClick={(row) => navigate(`/inventory/product/view/${row.id}`)}
        onEdit={(row) => navigate(`/inventory/edit-product/${row.id}`)}
        onDelete={(row) => setDeleteConfirm({ open: true, product: row })}
        searchable
        exportable
        selectable
        onBulkDelete={(rows) => {
          Promise.all(rows.map((r) => ProductService.deleteProduct(r.id)))
            .then(() => {
              dispatchToast(<div>Selected products deleted</div>, { intent: 'success' });
              loadProducts();
            })
            .catch((error) => {
              dispatchToast(<div>Failed to delete products: {error.message}</div>, {
                intent: 'error',
              });
            });
        }}
      />

      <ConfirmDialog
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, product: null })}
        onConfirm={() => {
          if (deleteConfirm.product) {
            handleDelete(deleteConfirm.product);
            setDeleteConfirm({ open: false, product: null });
          }
        }}
        title="Delete Product"
        message={`Are you sure you want to delete ${deleteConfirm.product?.name}? This action cannot be undone.`}
        variant="danger"
        confirmLabel="Delete"
      />
    </div>
  );
}
