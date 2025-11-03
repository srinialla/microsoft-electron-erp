import React from 'react';
import { Button } from '../../../renderer/components/ui/Button';
import ReportsService from '../services/ReportsService';
import { useToastController, useId } from '@fluentui/react-components';
import { ArrowDownload24Regular } from '@fluentui/react-icons';

export default function ExcelExportPage() {
  const toasterId = useId('toaster');
  const { dispatchToast } = useToastController(toasterId);

  const handleExportReport = async (reportType: string) => {
    try {
      // In production, would fetch actual report data
      const sampleData = [{ report: reportType, date: new Date().toISOString() }];
      await ReportsService.exportToCSV(sampleData, reportType);
      dispatchToast(<div>Report exported successfully</div>, { intent: 'success' });
    } catch (error) {
      dispatchToast(<div>Failed to export report: {(error as Error).message}</div>, {
        intent: 'error',
      });
    }
  };

  const exportOptions = [
    { id: 'sales-summary', label: 'Sales Summary', description: 'Export sales summary report' },
    {
      id: 'sales-by-customer',
      label: 'Sales by Customer',
      description: 'Export customer sales report',
    },
    {
      id: 'sales-by-product',
      label: 'Sales by Product',
      description: 'Export product sales report',
    },
    { id: 'income-statement', label: 'Income Statement', description: 'Export income statement' },
    { id: 'balance-sheet', label: 'Balance Sheet', description: 'Export balance sheet' },
    { id: 'trial-balance', label: 'Trial Balance', description: 'Export trial balance' },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ marginBottom: '24px' }}>Export Reports to Excel/CSV</h1>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px',
        }}
      >
        {exportOptions.map((option) => (
          <div
            key={option.id}
            style={{
              padding: '20px',
              border: '1px solid #e1e1e1',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <h3 style={{ margin: 0 }}>{option.label}</h3>
            <p style={{ margin: 0, color: '#616161', fontSize: '14px' }}>{option.description}</p>
            <Button
              variant="primary"
              icon={<ArrowDownload24Regular />}
              onClick={() => handleExportReport(option.id)}
            >
              Export CSV
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
