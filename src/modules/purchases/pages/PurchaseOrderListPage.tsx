import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataGrid } from '../../../shared/components';
import { Button } from '../../../renderer/components/ui/Button';
import PurchasesService from '../services/PurchasesService';
import type { PurchaseOrder } from '../../../shared/types/entities';
import { StatusBadge } from '../../../shared/components';
import { formatCurrency, formatDate } from '../../../shared/utils/formatting';
import { useToastController, useId } from '@fluentui/react-components';

export default function PurchaseOrderListPage() {
  const navigate = useNavigate();
  const toasterId = useId('toaster');
  const { dispatchToast } = useToastController(toasterId);

  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await PurchasesService.getPurchaseOrders();
      setOrders(data);
    } catch (error) {
      dispatchToast(<div>Failed to load purchase orders: {(error as Error).message}</div>, {
        intent: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      key: 'po_number',
      header: 'PO Number',
      sortable: true,
      width: '140px',
    },
    {
      key: 'order_date',
      header: 'Date',
      sortable: true,
      render: (value: string) => formatDate(value),
    },
    {
      key: 'vendor_id',
      header: 'Vendor',
      sortable: true,
      render: (value: number) => `Vendor ${value}`,
    },
    {
      key: 'grand_total',
      header: 'Amount',
      sortable: true,
      align: 'right' as const,
      render: (value: number) => formatCurrency(value || 0),
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
        <h1>Purchase Orders</h1>
        <Button variant="primary" onClick={() => navigate('/purchases/order/new')}>
          New Purchase Order
        </Button>
      </div>

      <DataGrid
        columns={columns}
        data={orders}
        loading={loading}
        onRowClick={(row) => navigate(`/purchases/order/view/${row.id}`)}
        searchable
        exportable
      />
    </div>
  );
}
