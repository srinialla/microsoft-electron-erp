import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../renderer/components/ui/Button';
import {
  DataBarVertical24Regular,
  DocumentText24Regular,
  People24Regular,
  Box24Regular,
  DataTrending24Regular,
} from '@fluentui/react-icons';

interface ReportCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  route: string;
  color: string;
}

export default function SalesReportsPage() {
  const navigate = useNavigate();

  const reports: ReportCard[] = [
    {
      id: 'sales-summary',
      title: 'Sales Summary',
      description: 'Overview of sales performance with totals and averages',
      icon: <DataTrending24Regular />,
      route: '/reports/sales-summary',
      color: '#0078d4',
    },
    {
      id: 'sales-by-customer',
      title: 'Sales by Customer',
      description: 'Detailed sales breakdown by customer',
      icon: <People24Regular />,
      route: '/reports/by-customer',
      color: '#107c10',
    },
    {
      id: 'sales-by-product',
      title: 'Sales by Product',
      description: 'Product performance analysis with profit margins',
      icon: <Box24Regular />,
      route: '/reports/by-product',
      color: '#ff8c00',
    },
    {
      id: 'invoice-list',
      title: 'Invoice List',
      description: 'View all invoices with filtering options',
      icon: <DocumentText24Regular />,
      route: '/sales/invoice/list',
      color: '#6264a7',
    },
    {
      id: 'order-list',
      title: 'Order List',
      description: 'View all sales orders',
      icon: <DataBarVertical24Regular />,
      route: '/sales/orders/list',
      color: '#8764b8',
    },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1>Sales Reports</h1>
        <p style={{ color: '#616161', marginTop: '8px' }}>
          Access comprehensive sales reports and analytics
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '24px',
        }}
      >
        {reports.map((report) => (
          <div
            key={report.id}
            onClick={() => navigate(report.route)}
            style={{
              padding: '24px',
              border: '1px solid #e1e1e1',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: '#fff',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '8px',
                  background: `${report.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: report.color,
                }}
              >
                {report.icon}
              </div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>{report.title}</h3>
            </div>
            <p style={{ color: '#616161', margin: 0, lineHeight: '1.5' }}>{report.description}</p>
            <Button
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                navigate(report.route);
              }}
              style={{ marginTop: '16px', width: '100%' }}
            >
              Open Report
            </Button>
          </div>
        ))}
      </div>

      <div
        style={{ marginTop: '32px', padding: '24px', background: '#f5f5f5', borderRadius: '8px' }}
      >
        <h3 style={{ marginTop: 0 }}>Additional Reports</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            marginTop: '16px',
          }}
        >
          <Button variant="outline" onClick={() => navigate('/reports/income-statement')}>
            Income Statement
          </Button>
          <Button variant="outline" onClick={() => navigate('/reports/balance-sheet')}>
            Balance Sheet
          </Button>
          <Button variant="outline" onClick={() => navigate('/reports/cash-flow')}>
            Cash Flow Statement
          </Button>
          <Button variant="outline" onClick={() => navigate('/reports/excel')}>
            Export to Excel
          </Button>
        </div>
      </div>
    </div>
  );
}
