import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataGrid } from '../../../shared/components';
import { Button } from '../../../renderer/components/ui/Button';
import SalesService from '../services/SalesService';
import type { SalesInvoice } from '../../../shared/types/entities';
import { StatusBadge } from '../../../shared/components';
import { formatCurrency, formatDate } from '../../../shared/utils/formatting';
import { useToastController, useId } from '@fluentui/react-components';

export default function InvoiceListPage() {
  const navigate = useNavigate();
  const toasterId = useId('toaster');
  const { dispatchToast } = useToastController(toasterId);

  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const data = await SalesService.getInvoices();
      setInvoices(data);
    } catch (error) {
      dispatchToast(<div>Failed to load invoices: {(error as Error).message}</div>, {
        intent: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      key: 'invoice_number',
      header: 'Invoice #',
      sortable: true,
      width: '140px',
    },
    {
      key: 'invoice_date',
      header: 'Date',
      sortable: true,
      render: (value: string) => formatDate(value),
    },
    {
      key: 'due_date',
      header: 'Due Date',
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
      header: 'Amount',
      sortable: true,
      align: 'right' as const,
      render: (value: number) => formatCurrency(value || 0),
    },
    {
      key: 'paid_amount',
      header: 'Paid',
      sortable: true,
      align: 'right' as const,
      render: (value: number, row: SalesInvoice) => (
        <span style={{ color: value >= row.grand_total ? '#107c10' : '#616161' }}>
          {formatCurrency(value || 0)}
        </span>
      ),
    },
    {
      key: 'balance_amount',
      header: 'Balance',
      sortable: true,
      align: 'right' as const,
      render: (value: number) => (
        <span style={{ color: value > 0 ? '#d13438' : '#107c10' }}>
          {formatCurrency(value || 0)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (value: string) => <StatusBadge status={value as any} />,
    },
    {
      key: 'payment_status',
      header: 'Payment',
      sortable: true,
      render: (value: string) => <StatusBadge status={value === 'paid' ? 'paid' : 'pending'} />,
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
        <h1>Sales Invoices</h1>
        <Button variant="primary" onClick={() => navigate('/sales/invoice/new')}>
          New Invoice
        </Button>
      </div>

      <DataGrid
        columns={columns}
        data={invoices}
        loading={loading}
        onRowClick={(row) => navigate(`/sales/invoice/view/${row.id}`)}
        onEdit={(row) => navigate(`/sales/invoice/edit/${row.id}`)}
        searchable
        exportable
      />
    </div>
  );
}
