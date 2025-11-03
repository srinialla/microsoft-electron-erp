import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataGrid } from '../../../shared/components';
import { Button } from '../../../renderer/components/ui/Button';
import SalesService from '../services/SalesService';
import type { SalesQuotation } from '../../../shared/types/entities';
import { StatusBadge } from '../../../shared/components';
import { formatCurrency, formatDate } from '../../../shared/utils/formatting';
import { useToastController, useId } from '@fluentui/react-components';

export default function QuotationListPage() {
  const navigate = useNavigate();
  const toasterId = useId('toaster');
  const { dispatchToast } = useToastController(toasterId);

  const [quotations, setQuotations] = useState<SalesQuotation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuotations();
  }, []);

  const loadQuotations = async () => {
    try {
      setLoading(true);
      const data = await SalesService.getQuotations();
      setQuotations(data);
    } catch (error) {
      dispatchToast(<div>Failed to load quotations: {(error as Error).message}</div>, {
        intent: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      key: 'quotation_number',
      header: 'Quotation #',
      sortable: true,
      width: '140px',
    },
    {
      key: 'quotation_date',
      header: 'Date',
      sortable: true,
      render: (value: string) => formatDate(value),
    },
    {
      key: 'valid_until',
      header: 'Valid Until',
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
        <h1>Sales Quotations</h1>
        <Button variant="primary" onClick={() => navigate('/sales/quotation/new')}>
          New Quotation
        </Button>
      </div>

      <DataGrid
        columns={columns}
        data={quotations}
        loading={loading}
        onRowClick={(row) => navigate(`/sales/quotation/view/${row.id}`)}
        onEdit={(row) => navigate(`/sales/quotation/edit/${row.id}`)}
        searchable
        exportable
      />
    </div>
  );
}
