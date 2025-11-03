import React, { useState, useEffect } from 'react';
import { DataGrid } from '../../../shared/components';
import { Button } from '../../../renderer/components/ui/Button';
import { FormDatePicker } from '../../../shared/components';
import ReportsService from '../services/ReportsService';
import { formatCurrency } from '../../../shared/utils/formatting';
import { LoadingSpinner } from '../../../shared/components';
import { useToastController, useId } from '@fluentui/react-components';
import { ArrowDownload24Regular } from '@fluentui/react-icons';
import type { SalesByProductData } from '../services/ReportsService';

export default function SalesByProductPage() {
  const toasterId = useId('toaster');
  const { dispatchToast } = useToastController(toasterId);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SalesByProductData[]>([]);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [dateTo, setDateTo] = useState<Date | undefined>(new Date());

  useEffect(() => {
    loadReport();
  }, [dateFrom, dateTo]);

  const loadReport = async () => {
    try {
      setLoading(true);
      const result = await ReportsService.getSalesByProduct(
        dateFrom?.toISOString().split('T')[0],
        dateTo?.toISOString().split('T')[0],
      );
      setData(result);
    } catch (error) {
      dispatchToast(<div>Failed to load report: {(error as Error).message}</div>, {
        intent: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      await ReportsService.exportToCSV(data, 'sales-by-product');
      dispatchToast(<div>Report exported successfully</div>, { intent: 'success' });
    } catch (error) {
      dispatchToast(<div>Failed to export report: {(error as Error).message}</div>, {
        intent: 'error',
      });
    }
  };

  const columns = [
    {
      key: 'product_name',
      header: 'Product',
      sortable: true,
    },
    {
      key: 'quantity_sold',
      header: 'Quantity Sold',
      sortable: true,
      align: 'right' as const,
    },
    {
      key: 'total_sales',
      header: 'Total Sales',
      sortable: true,
      align: 'right' as const,
      render: (value: number) => formatCurrency(value),
    },
    {
      key: 'total_cost',
      header: 'Total Cost',
      sortable: true,
      align: 'right' as const,
      render: (value: number) => formatCurrency(value),
    },
    {
      key: 'profit',
      header: 'Profit',
      sortable: true,
      align: 'right' as const,
      render: (value: number) => (
        <span style={{ color: value >= 0 ? '#107c10' : '#d13438' }}>{formatCurrency(value)}</span>
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
        <h1>Sales by Product</h1>
        <Button variant="outline" icon={<ArrowDownload24Regular />} onClick={handleExport}>
          Export CSV
        </Button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <FormDatePicker
          label="From Date"
          name="date_from"
          value={dateFrom}
          onChange={setDateFrom}
        />
        <FormDatePicker label="To Date" name="date_to" value={dateTo} onChange={setDateTo} />
      </div>

      {loading ? (
        <LoadingSpinner variant="page" />
      ) : (
        <DataGrid columns={columns} data={data} searchable exportable />
      )}
    </div>
  );
}
