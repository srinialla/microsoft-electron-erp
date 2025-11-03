import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataGrid } from '../../../shared/components';
import { Button } from '../../../renderer/components/ui/Button';
import { ConfirmDialog } from '../../../shared/components';
import VendorService from '../../inventory/services/VendorService';
import type { Vendor } from '../../../shared/types/entities';
import { StatusBadge } from '../../../shared/components';
import { useToastController, useId } from '@fluentui/react-components';

export default function VendorListPage() {
  const navigate = useNavigate();
  const toasterId = useId('toaster');
  const { dispatchToast } = useToastController(toasterId);

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; vendor: Vendor | null }>({
    open: false,
    vendor: null,
  });

  useEffect(() => {
    loadVendors();
  }, []);

  const loadVendors = async () => {
    try {
      setLoading(true);
      const data = await VendorService.getVendors();
      setVendors(data);
    } catch (error) {
      dispatchToast(<div>Failed to load vendors: {(error as Error).message}</div>, {
        intent: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (vendor: Vendor) => {
    try {
      await VendorService.deleteVendor(vendor.id);
      dispatchToast(<div>Vendor deleted successfully</div>, { intent: 'success' });
      loadVendors();
    } catch (error) {
      dispatchToast(<div>Failed to delete vendor: {(error as Error).message}</div>, {
        intent: 'error',
      });
    }
  };

  const columns = [
    {
      key: 'vendor_code',
      header: 'Code',
      sortable: true,
      width: '120px',
    },
    {
      key: 'display_name',
      header: 'Name',
      sortable: true,
      render: (value: string, row: Vendor) => (
        <div>
          <div style={{ fontWeight: 500 }}>{value}</div>
          {row.email && <div style={{ fontSize: '12px', color: '#616161' }}>{row.email}</div>}
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      sortable: true,
    },
    {
      key: 'vendor_type',
      header: 'Type',
      sortable: true,
      render: (value: string) => <span style={{ textTransform: 'capitalize' }}>{value}</span>,
    },
    {
      key: 'payment_terms',
      header: 'Payment Terms',
      sortable: true,
      render: (value: number) => (value ? `${value} days` : '-'),
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
        <h1>Vendors</h1>
        <Button variant="primary" onClick={() => navigate('/purchases/vendor/new')}>
          Add Vendor
        </Button>
      </div>

      <DataGrid
        columns={columns}
        data={vendors}
        loading={loading}
        onRowClick={(row) => navigate(`/purchases/vendor/view/${row.id}`)}
        onEdit={(row) => navigate(`/purchases/vendor/edit/${row.id}`)}
        onDelete={(row) => setDeleteConfirm({ open: true, vendor: row })}
        searchable
        exportable
        selectable
      />

      <ConfirmDialog
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, vendor: null })}
        onConfirm={() => {
          if (deleteConfirm.vendor) {
            handleDelete(deleteConfirm.vendor);
            setDeleteConfirm({ open: false, vendor: null });
          }
        }}
        title="Delete Vendor"
        message={`Are you sure you want to delete ${deleteConfirm.vendor?.display_name}? This action cannot be undone.`}
        variant="danger"
        confirmLabel="Delete"
      />
    </div>
  );
}
