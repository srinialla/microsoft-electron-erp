import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../renderer/components/ui/Button';
import {
  DataBarVertical24Regular,
  DocumentText24Regular,
  Box24Regular,
  DataTrending24Regular,
  Cart24Regular,
} from '@fluentui/react-icons';

interface ReportCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  route: string;
  color: string;
}

export default function PurchaseReportsPage() {
  const navigate = useNavigate();

  const reports: ReportCard[] = [
    {
      id: 'purchase-orders',
      title: 'Purchase Orders',
      description: 'View all purchase orders with filtering options',
      icon: <DocumentText24Regular />,
      route: '/purchases/order/list',
      color: '#0078d4',
    },
    {
      id: 'goods-received',
      title: 'Goods Received',
      description: 'Track all goods received notes (GRNs)',
      icon: <Box24Regular />,
      route: '/purchases/goods-received/list',
      color: '#107c10',
    },
    {
      id: 'purchase-returns',
      title: 'Purchase Returns',
      description: 'View purchase returns and refunds',
      icon: <Cart24Regular />,
      route: '/purchases/return/list',
      color: '#d13438',
    },
    {
      id: 'vendor-list',
      title: 'Vendor List',
      description: 'Manage vendors and supplier information',
      icon: <DataBarVertical24Regular />,
      route: '/purchases/vendors/list',
      color: '#6264a7',
    },
    {
      id: 'vendor-performance',
      title: 'Vendor Performance',
      description: 'Analyze vendor performance and delivery times',
      icon: <DataTrending24Regular />,
      route: '/purchases/vendors/list',
      color: '#8764b8',
    },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1>Purchase Reports</h1>
        <p style={{ color: '#616161', marginTop: '8px' }}>
          Access comprehensive purchase reports and analytics
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
        <h3 style={{ marginTop: 0 }}>Quick Actions</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            marginTop: '16px',
          }}
        >
          <Button variant="outline" onClick={() => navigate('/purchases/order/new')}>
            New Purchase Order
          </Button>
          <Button variant="outline" onClick={() => navigate('/purchases/goods-received/new')}>
            Receive Goods
          </Button>
          <Button variant="outline" onClick={() => navigate('/purchases/vendors/list')}>
            Manage Vendors
          </Button>
          <Button variant="outline" onClick={() => navigate('/reports')}>
            All Reports
          </Button>
        </div>
      </div>
    </div>
  );
}
