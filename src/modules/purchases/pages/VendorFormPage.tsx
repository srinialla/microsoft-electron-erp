import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../../renderer/components/ui/Button';
import { FormInput, FormSelect, FormTextarea, FormNumberInput } from '../../../shared/components';
import VendorService, { type VendorFormData } from '../../inventory/services/VendorService';
import { useToastController, useId } from '@fluentui/react-components';
import { LoadingSpinner } from '../../../shared/components';

export default function VendorFormPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const toasterId = useId('toaster');
  const { dispatchToast } = useToastController(toasterId);
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<VendorFormData>({
    vendor_type: 'company',
    name: '',
    display_name: '',
    status: 'active',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isEdit && id) {
      loadVendor(parseInt(id));
    }
  }, [id, isEdit]);

  const loadVendor = async (vendorId: number) => {
    try {
      setLoading(true);
      const vendor = await VendorService.getVendorById(vendorId);
      if (vendor) {
        setFormData({
          vendor_type: vendor.vendor_type,
          name: vendor.name || vendor.display_name || '',
          display_name: vendor.display_name,
          email: vendor.email,
          phone: vendor.phone,
          website: vendor.website,
          contact_person: vendor.contact_person,
          billing_address_line1: vendor.billing_address_line1,
          billing_address_line2: vendor.billing_address_line2,
          billing_city: vendor.billing_city,
          billing_state: vendor.billing_state,
          billing_country: vendor.billing_country,
          billing_postal_code: vendor.billing_postal_code,
          tax_number: vendor.tax_number,
          gst_number: vendor.gst_number,
          payment_terms: vendor.payment_terms,
          bank_name: vendor.bank_name,
          bank_account_number: vendor.bank_account_number,
          bank_ifsc: vendor.bank_ifsc,
          preferred_payment_method: vendor.preferred_payment_method,
          rating: vendor.rating,
          notes: vendor.notes,
          status: vendor.status,
        });
      }
    } catch (error) {
      dispatchToast(<div>Failed to load vendor: {(error as Error).message}</div>, {
        intent: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.display_name?.trim()) {
      newErrors.display_name = 'Display name is required';
    }

    if (!formData.name?.trim()) {
      newErrors.name = 'Name is required';
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
        await VendorService.updateVendor(parseInt(id), formData);
        dispatchToast(<div>Vendor updated successfully</div>, { intent: 'success' });
      } else {
        await VendorService.createVendor(formData);
        dispatchToast(<div>Vendor created successfully</div>, { intent: 'success' });
      }

      navigate('/purchases/vendors/list');
    } catch (error) {
      dispatchToast(<div>Failed to save vendor: {(error as Error).message}</div>, {
        intent: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateField = <K extends keyof VendorFormData>(field: K, value: VendorFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field as string];
        return newErrors;
      });
    }
  };

  if (loading && isEdit) {
    return <LoadingSpinner variant="page" />;
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1>{isEdit ? 'Edit Vendor' : 'New Vendor'}</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gap: '24px' }}>
          <div>
            <h2>Basic Information</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <FormSelect
                label="Vendor Type"
                name="vendor_type"
                value={formData.vendor_type}
                onChange={(value) => updateField('vendor_type', value as 'individual' | 'company')}
                options={[
                  { value: 'individual', label: 'Individual' },
                  { value: 'company', label: 'Company' },
                ]}
                required
              />
              <FormInput
                label="Name"
                name="name"
                value={formData.name || ''}
                onChange={(value) => updateField('name', value)}
                required
                error={errors.name}
              />
              <FormInput
                label="Display Name"
                name="display_name"
                value={formData.display_name || ''}
                onChange={(value) => updateField('display_name', value)}
                required
                error={errors.display_name}
              />
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
                label="Website"
                name="website"
                type="url"
                value={formData.website || ''}
                onChange={(value) => updateField('website', value)}
              />
              <FormInput
                label="Contact Person"
                name="contact_person"
                value={formData.contact_person || ''}
                onChange={(value) => updateField('contact_person', value)}
              />
            </div>
          </div>

          <div>
            <h2>Address</h2>
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

          <div>
            <h2>Tax & Banking</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <FormInput
                label="Tax Number"
                name="tax_number"
                value={formData.tax_number || ''}
                onChange={(value) => updateField('tax_number', value)}
              />
              <FormInput
                label="GST Number"
                name="gst_number"
                value={formData.gst_number || ''}
                onChange={(value) => updateField('gst_number', value)}
              />
              <FormNumberInput
                label="Payment Terms (Days)"
                name="payment_terms"
                value={formData.payment_terms || 30}
                onChange={(value) => updateField('payment_terms', value || 30)}
                min={0}
              />
              <FormInput
                label="Bank Name"
                name="bank_name"
                value={formData.bank_name || ''}
                onChange={(value) => updateField('bank_name', value)}
              />
              <FormInput
                label="Bank Account Number"
                name="bank_account_number"
                value={formData.bank_account_number || ''}
                onChange={(value) => updateField('bank_account_number', value)}
              />
              <FormInput
                label="Bank IFSC Code"
                name="bank_ifsc"
                value={formData.bank_ifsc || ''}
                onChange={(value) => updateField('bank_ifsc', value)}
              />
            </div>
          </div>

          <div>
            <h2>Additional Information</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <FormSelect
                label="Status"
                name="status"
                value={formData.status}
                onChange={(value) => updateField('status', value as 'active' | 'inactive')}
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                ]}
                required
              />
              <FormTextarea
                label="Notes"
                name="notes"
                value={formData.notes || ''}
                onChange={(value) => updateField('notes', value)}
                rows={3}
              />
            </div>
          </div>
        </div>

        <div
          style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}
        >
          <Button
            variant="outline"
            onClick={() => navigate('/purchases/vendors/list')}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            {isEdit ? 'Update' : 'Create'} Vendor
          </Button>
        </div>
      </form>
    </div>
  );
}
