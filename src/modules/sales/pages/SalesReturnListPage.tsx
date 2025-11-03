import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataGrid } from '../../../shared/components';
import { Button } from '../../../renderer/components/ui/Button';
import SalesService from '../services/SalesService';
import type { SalesReturn } from '../../../shared/types/entities';
import { StatusBadge } from '../../../shared/components';
import { formatCurrency, formatDate } from '../../../shared/utils/formatting';
import { useToastController, useId } from '@fluentui/react-components';

export default function SalesReturnListPage() {
  const navigate = useNavigate();
  const toasterId = useId('toaster');
  const { dispatchToast } = useToastController(toasterId);

  const [returns, setReturns] = useState<SalesReturn[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReturns();
  }, []);

  const loadReturns = async () => {
    try {
      setLoading(true);
      // TODO: Implement getSalesReturns in SalesService
      setReturns([]);
    } catch (error) {
      dispatchToast(<div>Failed to load sales returns: {(error as Error).message}</div>, {
        intent: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      key: 'return_number',
      header: 'Return #',
      sortable: true,
      width: '140px',
    },
    {
      key: 'return_date',
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
        <h1>Sales Returns</h1>
        <Button variant="primary" onClick={() => navigate('/sales/return/new')}>
          New Return
        </Button>
      </div>

      <DataGrid
        columns={columns}
        data={returns}
        loading={loading}
        onRowClick={(row) => navigate(`/sales/return/view/${row.id}`)}
        searchable
        exportable
      />
    </div>
  );
}
