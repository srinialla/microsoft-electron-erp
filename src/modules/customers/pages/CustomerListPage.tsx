import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataGrid } from '../../../shared/components';
import { Button } from '../../../renderer/components/ui/Button';
import { ConfirmDialog } from '../../../shared/components';
import CustomerService from '../services/CustomerService';
import type { Customer } from '../../../shared/types/entities';
import { StatusBadge } from '../../../shared/components';
import { formatCurrency } from '../../../shared/utils/formatting';
import { useToastController, useId } from '@fluentui/react-components';

export default function CustomerListPage() {
  const navigate = useNavigate();
  const toasterId = useId('toaster');
  const { dispatchToast } = useToastController(toasterId);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; customer: Customer | null }>({
    open: false,
    customer: null,
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await CustomerService.getCustomers();
      setCustomers(data);
    } catch (error) {
      dispatchToast(
        <div>Failed to load customers: {(error as Error).message}</div>,
        { intent: 'error' }
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (customer: Customer) => {
    try {
      await CustomerService.deleteCustomer(customer.id);
      dispatchToast(<div>Customer deleted successfully</div>, { intent: 'success' });
      loadCustomers();
    } catch (error) {
      dispatchToast(<div>Failed to delete customer: {(error as Error).message}</div>, { intent: 'error' });
    }
  };

  const columns = [
    {
      key: 'customer_code',
      header: 'Code',
      sortable: true,
      width: '120px',
    },
    {
      key: 'display_name',
      header: 'Name',
      sortable: true,
      render: (value: string, row: Customer) => (
        <div>
          <div style={{ fontWeight: 500 }}>{value}</div>
          {row.email && (
            <div style={{ fontSize: '12px', color: '#616161' }}>{row.email}</div>
          )}
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      sortable: true,
    },
    {
      key: 'customer_type',
      header: 'Type',
      sortable: true,
      render: (value: string) => (
        <span style={{ textTransform: 'capitalize' }}>{value}</span>
      ),
    },
    {
      key: 'credit_limit',
      header: 'Credit Limit',
      sortable: true,
      align: 'right' as const,
      render: (value: number) => (value ? formatCurrency(value) : '-'),
    },
    {
      key: 'current_balance',
      header: 'Balance',
      sortable: true,
      align: 'right' as const,
      render: (value: number) => (
        <span style={{ color: value < 0 ? '#d13438' : '#616161' }}>
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
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1>Customers</h1>
        <Button variant="primary" onClick={() => navigate('/customers/new')}>
          Add Customer
        </Button>
      </div>

      <DataGrid
        columns={columns}
        data={customers}
        loading={loading}
        onRowClick={(row) => navigate(`/customers/view/${row.id}`)}
        onEdit={(row) => navigate(`/customers/edit/${row.id}`)}
        onDelete={(row) => setDeleteConfirm({ open: true, customer: row })}
        searchable
        exportable
        selectable
        onBulkDelete={(rows) => {
          Promise.all(rows.map((r) => CustomerService.deleteCustomer(r.id)))
            .then(() => {
              dispatchToast(<div>Selected customers deleted</div>, { intent: 'success' });
              loadCustomers();
            })
            .catch((error) => {
              dispatchToast(<div>Failed to delete customers: {error.message}</div>, { intent: 'error' });
            });
        }}
      />

      <ConfirmDialog
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, customer: null })}
        onConfirm={() => {
          if (deleteConfirm.customer) {
            handleDelete(deleteConfirm.customer);
            setDeleteConfirm({ open: false, customer: null });
          }
        }}
        title="Delete Customer"
        message={`Are you sure you want to delete ${deleteConfirm.customer?.display_name}? This action cannot be undone.`}
        variant="danger"
        confirmLabel="Delete"
      />
    </div>
  );
}
