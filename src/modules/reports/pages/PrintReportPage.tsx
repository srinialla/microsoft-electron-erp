import React from 'react';
import { Button } from '../../../renderer/components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { Print24Regular } from '@fluentui/react-icons';

export default function PrintReportPage() {
  const navigate = useNavigate();

  const reportOptions = [
    {
      path: '/reports/sales-summary',
      label: 'Sales Summary',
      description: 'Print sales summary report',
    },
    {
      path: '/reports/by-customer',
      label: 'Sales by Customer',
      description: 'Print customer sales report',
    },
    {
      path: '/reports/by-product',
      label: 'Sales by Product',
      description: 'Print product sales report',
    },
    {
      path: '/reports/income-statement',
      label: 'Income Statement',
      description: 'Print income statement',
    },
    { path: '/reports/balance-sheet', label: 'Balance Sheet', description: 'Print balance sheet' },
    {
      path: '/accounting/trial-balance',
      label: 'Trial Balance',
      description: 'Print trial balance',
    },
  ];

  const handlePrint = (path: string) => {
    navigate(path);
    setTimeout(() => {
      window.print();
    }, 500);
  };

  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ marginBottom: '24px' }}>Print Reports</h1>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px',
        }}
      >
        {reportOptions.map((option) => (
          <div
            key={option.path}
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
              icon={<Print24Regular />}
              onClick={() => handlePrint(option.path)}
            >
              Print Report
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
