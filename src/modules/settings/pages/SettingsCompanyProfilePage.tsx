import React, { useState, useEffect } from 'react';
import { Button } from '../../../renderer/components/ui/Button';
import { FormInput, FormTextarea, FormSelect, FormNumberInput } from '../../../shared/components';
import SettingsService from '../services/SettingsService';
import type { Company } from '../../../shared/types/entities';
import { useToastController, useId } from '@fluentui/react-components';
import { LoadingSpinner } from '../../../shared/components';

export default function SettingsCompanyProfilePage() {
  const toasterId = useId('toaster');
  const { dispatchToast } = useToastController(toasterId);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Company>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadCompany();
  }, []);

  const loadCompany = async () => {
    try {
      setLoading(true);
      const company = await SettingsService.getCompany();
      if (company) {
        setFormData(company);
      } else {
        setFormData({
          name: '',
          currency: 'INR',
        });
      }
    } catch (error) {
      dispatchToast(<div>Failed to load company profile: {(error as Error).message}</div>, {
        intent: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Company name is required';
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
      setSaving(true);
      await SettingsService.updateCompany(formData);
      dispatchToast(<div>Company profile updated successfully</div>, { intent: 'success' });
    } catch (error) {
      dispatchToast(<div>Failed to save company profile: {(error as Error).message}</div>, {
        intent: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const updateField = <K extends keyof Company>(field: K, value: Company[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as string]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field as string];
        return newErrors;
      });
    }
  };

  if (loading) {
    return <LoadingSpinner variant="page" />;
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '24px' }}>Company Profile</h1>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <h2>Basic Information</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <FormInput
                label="Company Name"
                name="name"
                value={formData.name || ''}
                onChange={(value) => updateField('name', value)}
                required
                error={errors.name}
              />
              <FormInput
                label="Legal Name"
                name="legal_name"
                value={formData.legal_name || ''}
                onChange={(value) => updateField('legal_name', value)}
              />
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
              <FormInput
                label="PAN Number"
                name="pan_number"
                value={formData.pan_number || ''}
                onChange={(value) => updateField('pan_number', value)}
              />
            </div>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <h2>Contact Information</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <FormInput
                label="Email"
                name="email"
                type="email"
                value={formData.email || ''}
                onChange={(value) => updateField('email', value)}
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
            </div>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <h2>Address</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <FormInput
                label="Address Line 1"
                name="address_line1"
                value={formData.address_line1 || ''}
                onChange={(value) => updateField('address_line1', value)}
              />
              <FormInput
                label="Address Line 2"
                name="address_line2"
                value={formData.address_line2 || ''}
                onChange={(value) => updateField('address_line2', value)}
              />
              <FormInput
                label="City"
                name="city"
                value={formData.city || ''}
                onChange={(value) => updateField('city', value)}
              />
              <FormInput
                label="State"
                name="state"
                value={formData.state || ''}
                onChange={(value) => updateField('state', value)}
              />
              <FormInput
                label="Country"
                name="country"
                value={formData.country || ''}
                onChange={(value) => updateField('country', value)}
              />
              <FormInput
                label="Postal Code"
                name="postal_code"
                value={formData.postal_code || ''}
                onChange={(value) => updateField('postal_code', value)}
              />
            </div>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <h2>Settings</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <FormSelect
                label="Currency"
                name="currency"
                value={formData.currency || 'INR'}
                onChange={(value) => updateField('currency', value as string)}
                options={[
                  { value: 'INR', label: 'INR - Indian Rupee' },
                  { value: 'USD', label: 'USD - US Dollar' },
                  { value: 'EUR', label: 'EUR - Euro' },
                  { value: 'GBP', label: 'GBP - British Pound' },
                ]}
              />
              <FormInput
                label="Fiscal Year Start"
                name="fiscal_year_start"
                value={formData.fiscal_year_start || ''}
                onChange={(value) => updateField('fiscal_year_start', value)}
                placeholder="MM-DD"
              />
            </div>
          </div>
        </div>

        <div
          style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}
        >
          <Button type="submit" variant="primary" loading={saving}>
            Save Company Profile
          </Button>
        </div>
      </form>
    </div>
  );
}
