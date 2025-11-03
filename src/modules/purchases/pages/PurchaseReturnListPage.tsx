import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataGrid } from '../../../shared/components';
import { Button } from '../../../renderer/components/ui/Button';
import PurchasesService from '../services/PurchasesService';
import type { PurchaseReturn } from '../../../shared/types/entities';
import { StatusBadge } from '../../../shared/components';
import { formatCurrency, formatDate } from '../../../shared/utils/formatting';
import { useToastController, useId } from '@fluentui/react-components';

export default function PurchaseReturnListPage() {
  const navigate = useNavigate();
  const toasterId = useId('toaster');
  const { dispatchToast } = useToastController(toasterId);

  const [returns, setReturns] = useState<PurchaseReturn[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReturns();
  }, []);

  const loadReturns = async () => {
    try {
      setLoading(true);
      // TODO: Implement getPurchaseReturns in PurchasesService
      setReturns([]);
    } catch (error) {
      dispatchToast(<div>Failed to load purchase returns: {(error as Error).message}</div>, {
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
      key: 'po_id',
      header: 'PO #',
      sortable: true,
      render: (value: number) => (value ? `PO-${value}` : '-'),
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
        <h1>Purchase Returns</h1>
        <Button variant="primary" onClick={() => navigate('/purchases/return/new')}>
          New Return
        </Button>
      </div>

      <DataGrid
        columns={columns}
        data={returns}
        loading={loading}
        onRowClick={(row) => navigate(`/purchases/return/view/${row.id}`)}
        searchable
        exportable
      />
    </div>
  );
}
