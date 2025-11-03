import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataGrid } from '../../../shared/components';
import { Button } from '../../../renderer/components/ui/Button';
import SalesService from '../services/SalesService';
import { formatCurrency, formatDate } from '../../../shared/utils/formatting';
import { useToastController, useId } from '@fluentui/react-components';
import { LoadingSpinner } from '../../../shared/components';
import type { SalesOrder } from '../../../shared/types/entities';

export default function DeliveryNotesPage() {
  const navigate = useNavigate();
  const toasterId = useId('toaster');
  const { dispatchToast } = useToastController(toasterId);

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<SalesOrder[]>([]);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await SalesService.getOrders({ status: 'pending' });
      setOrders(data);
    } catch (error) {
      dispatchToast(<div>Failed to load orders: {(error as Error).message}</div>, {
        intent: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDeliveryNote = (order: SalesOrder) => {
    navigate(`/sales/delivery/new?orderId=${order.id}`);
  };

  const columns = [
    {
      key: 'order_number',
      header: 'Order #',
      sortable: true,
      width: '140px',
    },
    {
      key: 'order_date',
      header: 'Order Date',
      sortable: true,
      render: (value: string) => formatDate(value),
    },
    {
      key: 'customer_id',
      header: 'Customer',
      sortable: true,
      render: (value: number) => `Customer ${value}`,
    },
    {
      key: 'grand_total',
      header: 'Total',
      sortable: true,
      align: 'right' as const,
      render: (value: number) => formatCurrency(value || 0),
    },
    {
      key: 'fulfillment_status',
      header: 'Status',
      sortable: true,
      render: (value: string) => (
        <span
          style={{
            textTransform: 'capitalize',
            color: value === 'fulfilled' ? '#107c10' : '#616161',
          }}
        >
          {value || 'Pending'}
        </span>
      ),
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
        <h1>Delivery Notes</h1>
        <Button variant="primary" onClick={() => navigate('/sales/orders/list')}>
          View All Orders
        </Button>
      </div>

      <div
        style={{
          marginBottom: '16px',
          padding: '16px',
          background: '#f5f5f5',
          borderRadius: '4px',
        }}
      >
        <p style={{ margin: 0, color: '#616161' }}>
          Create delivery notes for pending sales orders. Select an order from the list below to
          create a delivery note.
        </p>
      </div>

      {loading ? (
        <LoadingSpinner variant="page" />
      ) : orders.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#616161' }}>
          <p>No pending orders available for delivery.</p>
          <Button
            variant="outline"
            onClick={() => navigate('/sales/orders/new')}
            style={{ marginTop: '16px' }}
          >
            Create New Order
          </Button>
        </div>
      ) : (
        <DataGrid
          columns={columns}
          data={orders}
          loading={loading}
          onRowClick={(row) => handleCreateDeliveryNote(row)}
          searchable
        />
      )}
    </div>
  );
}
