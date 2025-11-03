import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../../renderer/components/ui/Button';
import { StatusBadge } from '../../../shared/components';
import { formatCurrency, formatDate } from '../../../shared/utils/formatting';
import CustomerService from '../services/CustomerService';
import type { Customer } from '../../../shared/types/entities';
import { LoadingSpinner } from '../../../shared/components';
import { DataGrid } from '../../../shared/components';
import { useToastController, useId } from '@fluentui/react-components';

export default function CustomerViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toasterId = useId('toaster');
  const { dispatchToast } = useToastController(toasterId);

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    if (id) {
      loadCustomer(parseInt(id));
    }
  }, [id]);

  const loadCustomer = async (customerId: number) => {
    try {
      setLoading(true);
      const [cust, txn] = await Promise.all([
        CustomerService.getCustomerById(customerId),
        CustomerService.getCustomerTransactions(customerId),
      ]);
      if (cust) {
        setCustomer(cust);
      }
      setTransactions(txn);
    } catch (error) {
      dispatchToast(
        <div>Failed to load customer: {(error as Error).message}</div>,
        { intent: 'error' }
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner variant="page" />;
  }

  if (!customer) {
    return (
      <div style={{ padding: '24px' }}>
        <div>Customer not found</div>
        <Button onClick={() => navigate('/customers/list')}>Back to List</Button>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1>{customer.display_name}</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button variant="outline" onClick={() => navigate(`/customers/edit/${customer.id}`)}>
            Edit
          </Button>
          <Button variant="outline" onClick={() => navigate('/customers/list')}>
            Back to List
          </Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* Basic Info Card */}
        <div style={{ padding: '20px', border: '1px solid #e1e1e1', borderRadius: '8px' }}>
          <h2 style={{ marginTop: 0 }}>Basic Information</h2>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div>
              <strong>Code:</strong> {customer.customer_code}
            </div>
            <div>
              <strong>Type:</strong> <span style={{ textTransform: 'capitalize' }}>{customer.customer_type}</span>
            </div>
            <div>
              <strong>Status:</strong> <StatusBadge status={customer.status as any} />
            </div>
            {customer.email && (
              <div>
                <strong>Email:</strong> {customer.email}
              </div>
            )}
            {customer.phone && (
              <div>
                <strong>Phone:</strong> {customer.phone}
              </div>
            )}
            {customer.mobile && (
              <div>
                <strong>Mobile:</strong> {customer.mobile}
              </div>
            )}
            {customer.website && (
              <div>
                <strong>Website:</strong> <a href={customer.website} target="_blank" rel="noopener noreferrer">{customer.website}</a>
              </div>
            )}
          </div>
        </div>

        {/* Financial Summary Card */}
        <div style={{ padding: '20px', border: '1px solid #e1e1e1', borderRadius: '8px' }}>
          <h2 style={{ marginTop: 0 }}>Financial Summary</h2>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div>
              <strong>Credit Limit:</strong> {customer.credit_limit ? formatCurrency(customer.credit_limit) : 'N/A'}
            </div>
            <div>
              <strong>Current Balance:</strong>{' '}
              <span style={{ color: (customer.current_balance || 0) < 0 ? '#d13438' : '#107c10', fontWeight: 600 }}>
                {formatCurrency(customer.current_balance || 0)}
              </span>
            </div>
            {customer.payment_terms && (
              <div>
                <strong>Payment Terms:</strong> {customer.payment_terms} days
              </div>
            )}
            {customer.discount_percent && (
              <div>
                <strong>Discount:</strong> {customer.discount_percent}%
              </div>
            )}
          </div>
        </div>

        {/* Address Cards */}
        {customer.billing_address_line1 && (
          <div style={{ padding: '20px', border: '1px solid #e1e1e1', borderRadius: '8px' }}>
            <h2 style={{ marginTop: 0 }}>Billing Address</h2>
            <div>
              {customer.billing_address_line1}
              {customer.billing_address_line2 && <br />}
              {customer.billing_address_line2}
              {customer.billing_city && <br />}
              {customer.billing_city}
              {customer.billing_state && `, ${customer.billing_state}`}
              {customer.billing_postal_code && ` ${customer.billing_postal_code}`}
              {customer.billing_country && <br />}
              {customer.billing_country}
            </div>
          </div>
        )}

        {customer.shipping_address_line1 && (
          <div style={{ padding: '20px', border: '1px solid #e1e1e1', borderRadius: '8px' }}>
            <h2 style={{ marginTop: 0 }}>Shipping Address</h2>
            <div>
              {customer.shipping_address_line1}
              {customer.shipping_address_line2 && <br />}
              {customer.shipping_address_line2}
              {customer.shipping_city && <br />}
              {customer.shipping_city}
              {customer.shipping_state && `, ${customer.shipping_state}`}
              {customer.shipping_postal_code && ` ${customer.shipping_postal_code}`}
              {customer.shipping_country && <br />}
              {customer.shipping_country}
            </div>
          </div>
        )}
      </div>

      {/* Transactions */}
      {transactions.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <h2>Recent Transactions</h2>
          <DataGrid
            columns={[
              { key: 'created_at', header: 'Date', render: (val) => formatDate(val) },
              { key: 'invoice_number', header: 'Document', render: (val) => val || '-' },
              { key: 'grand_total', header: 'Amount', render: (val) => val ? formatCurrency(val) : '-' },
              { key: 'status', header: 'Status', render: (val) => <StatusBadge status={val as any} /> },
            ]}
            data={transactions}
          />
        </div>
      )}

      {customer.notes && (
        <div style={{ marginTop: '24px', padding: '20px', border: '1px solid #e1e1e1', borderRadius: '8px' }}>
          <h2 style={{ marginTop: 0 }}>Notes</h2>
          <p>{customer.notes}</p>
        </div>
      )}
    </div>
  );
}

