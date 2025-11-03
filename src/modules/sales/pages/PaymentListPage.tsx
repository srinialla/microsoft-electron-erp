import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataGrid } from '../../../shared/components';
import { Button } from '../../../renderer/components/ui/Button';
import SalesService from '../services/SalesService';
import type { Payment } from '../../../shared/types/entities';
import { formatCurrency, formatDate } from '../../../shared/utils/formatting';
import { useToastController, useId } from '@fluentui/react-components';

export default function PaymentListPage() {
  const navigate = useNavigate();
  const toasterId = useId('toaster');
  const { dispatchToast } = useToastController(toasterId);

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      setLoading(true);
      // TODO: Implement getPayments in SalesService
      setPayments([]);
    } catch (error) {
      dispatchToast(<div>Failed to load payments: {(error as Error).message}</div>, {
        intent: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      key: 'payment_number',
      header: 'Payment #',
      sortable: true,
      width: '140px',
    },
    {
      key: 'payment_date',
      header: 'Date',
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
      key: 'amount',
      header: 'Amount',
      sortable: true,
      align: 'right' as const,
      render: (value: number) => formatCurrency(value || 0),
    },
    {
      key: 'payment_method',
      header: 'Method',
      sortable: true,
      render: (value: string) => (
        <span style={{ textTransform: 'capitalize' }}>{value?.replace('_', ' ')}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (value: string) => (
        <span
          style={{
            padding: '4px 8px',
            borderRadius: '4px',
            background: value === 'completed' ? '#d4edda' : '#fff3cd',
            color: value === 'completed' ? '#155724' : '#856404',
            fontSize: '12px',
          }}
        >
          {value}
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
        <h1>Customer Payments</h1>
        <Button variant="primary" onClick={() => navigate('/sales/payment/new')}>
          New Payment
        </Button>
      </div>

      <DataGrid
        columns={columns}
        data={payments}
        loading={loading}
        onRowClick={(row) => navigate(`/sales/payment/view/${row.id}`)}
        searchable
        exportable
      />
    </div>
  );
}
