import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../../renderer/components/ui/Button';
import {
  FormInput,
  FormSelect,
  FormTextarea,
  FormCheckbox,
  FormDatePicker,
  FormCurrency,
  FormNumberInput,
} from '../../../shared/components';
import CustomerService, { type CustomerFormData } from '../services/CustomerService';
import { useToastController, useId } from '@fluentui/react-components';

export default function CustomerFormPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const toasterId = useId('toaster');
  const { dispatchToast } = useToastController(toasterId);
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [formData, setFormData] = useState<CustomerFormData>({
    customer_type: 'individual',
    display_name: '',
    status: 'active',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isEdit && id) {
      loadCustomer(parseInt(id));
    }
  }, [id, isEdit]);

  const loadCustomer = async (customerId: number) => {
    try {
      setLoading(true);
      const customer = await CustomerService.getCustomerById(customerId);
      if (customer) {
        setFormData({
          customer_type: customer.customer_type,
          title: customer.title,
          first_name: customer.first_name,
          last_name: customer.last_name,
          company_name: customer.company_name,
          display_name: customer.display_name,
          email: customer.email,
          phone: customer.phone,
          mobile: customer.mobile,
          website: customer.website,
          contact_person: customer.contact_person,
          contact_person_email: customer.contact_person_email,
          contact_person_phone: customer.contact_person_phone,
          billing_address_line1: customer.billing_address_line1,
          billing_address_line2: customer.billing_address_line2,
          billing_city: customer.billing_city,
          billing_state: customer.billing_state,
          billing_country: customer.billing_country,
          billing_postal_code: customer.billing_postal_code,
          shipping_address_line1: customer.shipping_address_line1,
          shipping_address_line2: customer.shipping_address_line2,
          shipping_city: customer.shipping_city,
          shipping_state: customer.shipping_state,
          shipping_country: customer.shipping_country,
          shipping_postal_code: customer.shipping_postal_code,
          tax_number: customer.tax_number,
          pan_number: customer.pan_number,
          gst_number: customer.gst_number,
          customer_category_id: customer.customer_category_id,
          price_list_id: customer.price_list_id,
          payment_terms: customer.payment_terms,
          credit_limit: customer.credit_limit,
          discount_percent: customer.discount_percent,
          opening_balance: customer.opening_balance,
          notes: customer.notes,
          tags: customer.tags,
          status: customer.status,
        });
      }
    } catch (error) {
      dispatchToast(
        <div>Failed to load customer: {(error as Error).message}</div>,
        { intent: 'error' }
      );
    } finally {
      setLoading(false);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.display_name?.trim()) {
      newErrors.display_name = 'Display name is required';
    }

    if (formData.customer_type === 'individual' && !formData.first_name?.trim()) {
      newErrors.first_name = 'First name is required for individuals';
    }

    if (formData.customer_type === 'company' && !formData.company_name?.trim()) {
      newErrors.company_name = 'Company name is required for companies';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      dispatchToast(<div>Please fix the errors in the form</div>, { intent: 'error' });
      return;
    }

    try {
      setLoading(true);

      if (isEdit && id) {
        await CustomerService.updateCustomer(parseInt(id), formData);
        dispatchToast(<div>Customer updated successfully</div>, { intent: 'success' });
      } else {
        await CustomerService.createCustomer(formData);
        dispatchToast(<div>Customer created successfully</div>, { intent: 'success' });
      }

      navigate('/customers/list');
    } catch (error) {
      dispatchToast(<div>Failed to save customer: {(error as Error).message}</div>, { intent: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const updateField = <K extends keyof CustomerFormData>(
    field: K,
    value: CustomerFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Auto-generate display name
  useEffect(() => {
    if (formData.customer_type === 'individual') {
      const name = [formData.first_name, formData.last_name].filter(Boolean).join(' ');
      if (name) {
        updateField('display_name', name);
      }
    } else if (formData.customer_type === 'company') {
      if (formData.company_name) {
        updateField('display_name', formData.company_name);
      }
    }
  }, [formData.customer_type, formData.first_name, formData.last_name, formData.company_name]);

  // Copy billing to shipping
  useEffect(() => {
    if (sameAsBilling) {
      setFormData((prev) => ({
        ...prev,
        shipping_address_line1: prev.billing_address_line1,
        shipping_address_line2: prev.billing_address_line2,
        shipping_city: prev.billing_city,
        shipping_state: prev.billing_state,
        shipping_country: prev.billing_country,
        shipping_postal_code: prev.billing_postal_code,
      }));
    }
  }, [sameAsBilling]);

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1>{isEdit ? 'Edit Customer' : 'New Customer'}</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Basic Information */}
          <div style={{ gridColumn: '1 / -1' }}>
            <h2>Basic Information</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <FormSelect
                label="Customer Type"
                name="customer_type"
                value={formData.customer_type}
                onChange={(value) => updateField('customer_type', value as 'individual' | 'company')}
                options={[
                  { value: 'individual', label: 'Individual' },
                  { value: 'company', label: 'Company' },
                ]}
                required
              />

              {formData.customer_type === 'individual' && (
                <>
                  <FormSelect
                    label="Title"
                    name="title"
                    value={formData.title || ''}
                    onChange={(value) => updateField('title', value as string | undefined)}
                    options={[
                      { value: 'Mr', label: 'Mr' },
                      { value: 'Mrs', label: 'Mrs' },
                      { value: 'Ms', label: 'Ms' },
                      { value: 'Dr', label: 'Dr' },
                    ]}
                  />
                  <FormInput
                    label="First Name"
                    name="first_name"
                    value={formData.first_name || ''}
                    onChange={(value) => updateField('first_name', value)}
                    required
                    error={errors.first_name}
                  />
                  <FormInput
                    label="Last Name"
                    name="last_name"
                    value={formData.last_name || ''}
                    onChange={(value) => updateField('last_name', value)}
                  />
                </>
              )}

              {formData.customer_type === 'company' && (
                <FormInput
                  label="Company Name"
                  name="company_name"
                  value={formData.company_name || ''}
                  onChange={(value) => updateField('company_name', value)}
                  required
                  error={errors.company_name}
                />
              )}

              <FormInput
                label="Display Name"
                name="display_name"
                value={formData.display_name}
                onChange={(value) => updateField('display_name', value)}
                required
                error={errors.display_name}
              />
            </div>
          </div>

          {/* Contact Information */}
          <div style={{ gridColumn: '1 / -1' }}>
            <h2>Contact Information</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <FormInput
                label="Email"
                name="email"
                type="email"
                value={formData.email || ''}
                onChange={(value) => updateField('email', value)}
                error={errors.email}
              />
              <FormInput
                label="Phone"
                name="phone"
                type="tel"
                value={formData.phone || ''}
                onChange={(value) => updateField('phone', value)}
              />
              <FormInput
                label="Mobile"
                name="mobile"
                type="tel"
                value={formData.mobile || ''}
                onChange={(value) => updateField('mobile', value)}
              />
              <FormInput
                label="Website"
                name="website"
                type="url"
                value={formData.website || ''}
                onChange={(value) => updateField('website', value)}
              />
              {formData.customer_type === 'company' && (
                <>
                  <FormInput
                    label="Contact Person"
                    name="contact_person"
                    value={formData.contact_person || ''}
                    onChange={(value) => updateField('contact_person', value)}
                  />
                  <FormInput
                    label="Contact Person Email"
                    name="contact_person_email"
                    type="email"
                    value={formData.contact_person_email || ''}
                    onChange={(value) => updateField('contact_person_email', value)}
                  />
                  <FormInput
                    label="Contact Person Phone"
                    name="contact_person_phone"
                    type="tel"
                    value={formData.contact_person_phone || ''}
                    onChange={(value) => updateField('contact_person_phone', value)}
                  />
                </>
              )}
            </div>
          </div>

          {/* Billing Address */}
          <div style={{ gridColumn: '1 / -1' }}>
            <h2>Billing Address</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <FormInput
                label="Address Line 1"
                name="billing_address_line1"
                value={formData.billing_address_line1 || ''}
                onChange={(value) => updateField('billing_address_line1', value)}
              />
              <FormInput
                label="Address Line 2"
                name="billing_address_line2"
                value={formData.billing_address_line2 || ''}
                onChange={(value) => updateField('billing_address_line2', value)}
              />
              <FormInput
                label="City"
                name="billing_city"
                value={formData.billing_city || ''}
                onChange={(value) => updateField('billing_city', value)}
              />
              <FormInput
                label="State"
                name="billing_state"
                value={formData.billing_state || ''}
                onChange={(value) => updateField('billing_state', value)}
              />
              <FormInput
                label="Country"
                name="billing_country"
                value={formData.billing_country || ''}
                onChange={(value) => updateField('billing_country', value)}
              />
              <FormInput
                label="Postal Code"
                name="billing_postal_code"
                value={formData.billing_postal_code || ''}
                onChange={(value) => updateField('billing_postal_code', value)}
              />
            </div>
          </div>

          {/* Shipping Address */}
          <div style={{ gridColumn: '1 / -1' }}>
            <h2>Shipping Address</h2>
            <FormCheckbox
              label="Same as billing address"
              name="same_as_billing"
              checked={sameAsBilling}
              onChange={setSameAsBilling}
            />
            {!sameAsBilling && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
                <FormInput
                  label="Address Line 1"
                  name="shipping_address_line1"
                  value={formData.shipping_address_line1 || ''}
                  onChange={(value) => updateField('shipping_address_line1', value)}
                />
                <FormInput
                  label="Address Line 2"
                  name="shipping_address_line2"
                  value={formData.shipping_address_line2 || ''}
                  onChange={(value) => updateField('shipping_address_line2', value)}
                />
                <FormInput
                  label="City"
                  name="shipping_city"
                  value={formData.shipping_city || ''}
                  onChange={(value) => updateField('shipping_city', value)}
                />
                <FormInput
                  label="State"
                  name="shipping_state"
                  value={formData.shipping_state || ''}
                  onChange={(value) => updateField('shipping_state', value)}
                />
                <FormInput
                  label="Country"
                  name="shipping_country"
                  value={formData.shipping_country || ''}
                  onChange={(value) => updateField('shipping_country', value)}
                />
                <FormInput
                  label="Postal Code"
                  name="shipping_postal_code"
                  value={formData.shipping_postal_code || ''}
                  onChange={(value) => updateField('shipping_postal_code', value)}
                />
              </div>
            )}
          </div>

          {/* Tax & Financial */}
          <div style={{ gridColumn: '1 / -1' }}>
            <h2>Tax & Financial</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <FormInput
                label="Tax Number"
                name="tax_number"
                value={formData.tax_number || ''}
                onChange={(value) => updateField('tax_number', value)}
              />
              <FormInput
                label="PAN Number"
                name="pan_number"
                value={formData.pan_number || ''}
                onChange={(value) => updateField('pan_number', value)}
              />
              <FormInput
                label="GST Number"
                name="gst_number"
                value={formData.gst_number || ''}
                onChange={(value) => updateField('gst_number', value)}
              />
              <FormNumberInput
                label="Payment Terms (days)"
                name="payment_terms"
                value={formData.payment_terms}
                onChange={(value) => updateField('payment_terms', value)}
              />
              <FormCurrency
                label="Credit Limit"
                name="credit_limit"
                value={formData.credit_limit}
                onChange={(value) => updateField('credit_limit', value)}
              />
              <FormNumberInput
                label="Discount %"
                name="discount_percent"
                value={formData.discount_percent}
                onChange={(value) => updateField('discount_percent', value)}
                decimals={2}
                min={0}
                max={100}
              />
              {!isEdit && (
                <FormCurrency
                  label="Opening Balance"
                  name="opening_balance"
                  value={formData.opening_balance}
                  onChange={(value) => updateField('opening_balance', value)}
                />
              )}
            </div>
          </div>

          {/* Additional */}
          <div style={{ gridColumn: '1 / -1' }}>
            <h2>Additional</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <FormTextarea
                label="Notes"
                name="notes"
                value={formData.notes || ''}
                onChange={(value) => updateField('notes', value)}
                rows={4}
              />
              <FormInput
                label="Tags"
                name="tags"
                value={formData.tags || ''}
                onChange={(value) => updateField('tags', value)}
                helpText="Comma-separated tags"
              />
              <FormSelect
                label="Status"
                name="status"
                value={formData.status}
                onChange={(value) => updateField('status', value as 'active' | 'inactive')}
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                ]}
              />
            </div>
          </div>
        </div>

        <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <Button variant="outline" onClick={() => navigate('/customers/list')} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            {isEdit ? 'Update' : 'Create'} Customer
          </Button>
        </div>
      </form>
    </div>
  );
}
