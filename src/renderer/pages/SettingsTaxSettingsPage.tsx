import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { FormInput, FormNumberInput, FormSelect, DataGrid } from '../../shared/components';
import SettingsService from '../../modules/settings/services/SettingsService';
import { useToastController, useId } from '@fluentui/react-components';
import { LoadingSpinner } from '../../shared/components';

interface TaxSetting {
  id?: number;
  company_id?: number;
  tax_name: string;
  tax_code: string;
  tax_rate: number;
  tax_type: 'gst' | 'vat' | 'sales_tax' | 'service_tax' | 'other';
  apply_to: 'sales' | 'purchases' | 'both';
  is_compound: boolean;
  effective_from?: string;
  effective_until?: string;
  is_default: boolean;
  is_active: boolean;
}

export default function SettingsTaxSettingsPage() {
  const toasterId = useId('toaster');
  const { dispatchToast } = useToastController(toasterId);

  const [loading, setLoading] = useState(true);
  const [taxSettings, setTaxSettings] = useState<TaxSetting[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | undefined>();
  const [formData, setFormData] = useState<TaxSetting>({
    tax_name: '',
    tax_code: '',
    tax_rate: 0,
    tax_type: 'gst',
    apply_to: 'both',
    is_compound: false,
    is_default: false,
    is_active: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadTaxSettings();
  }, []);

  const loadTaxSettings = async () => {
    try {
      setLoading(true);
      const settings = await SettingsService.getTaxSettings();
      setTaxSettings(settings);
    } catch (error) {
      dispatchToast(<div>Failed to load tax settings: {(error as Error).message}</div>, {
        intent: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.tax_name?.trim()) {
      newErrors.tax_name = 'Tax name is required';
    }
    if (!formData.tax_code?.trim()) {
      newErrors.tax_code = 'Tax code is required';
    }
    if (formData.tax_rate <= 0 || formData.tax_rate > 100) {
      newErrors.tax_rate = 'Tax rate must be between 0 and 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      if (editingId) {
        await SettingsService.updateTaxSetting(editingId, formData);
        dispatchToast(<div>Tax setting updated successfully</div>, { intent: 'success' });
      } else {
        await SettingsService.createTaxSetting(formData);
        dispatchToast(<div>Tax setting created successfully</div>, { intent: 'success' });
      }
      await loadTaxSettings();
      handleCancel();
    } catch (error) {
      dispatchToast(<div>Failed to save tax setting: {(error as Error).message}</div>, {
        intent: 'error',
      });
    }
  };

  const handleEdit = (setting: TaxSetting) => {
    setFormData(setting);
    setEditingId(setting.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this tax setting?')) {
      return;
    }

    try {
      await SettingsService.deleteTaxSetting(id);
      dispatchToast(<div>Tax setting deleted successfully</div>, { intent: 'success' });
      await loadTaxSettings();
    } catch (error) {
      dispatchToast(<div>Failed to delete tax setting: {(error as Error).message}</div>, {
        intent: 'error',
      });
    }
  };

  const handleCancel = () => {
    setFormData({
      tax_name: '',
      tax_code: '',
      tax_rate: 0,
      tax_type: 'gst',
      apply_to: 'both',
      is_compound: false,
      is_default: false,
      is_active: true,
    });
    setEditingId(undefined);
    setShowForm(false);
    setErrors({});
  };

  const updateField = <K extends keyof TaxSetting>(field: K, value: TaxSetting[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as string]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field as string];
        return newErrors;
      });
    }
  };

  const columns = [
    {
      key: 'tax_name',
      header: 'Tax Name',
      sortable: true,
    },
    {
      key: 'tax_code',
      header: 'Tax Code',
      sortable: true,
    },
    {
      key: 'tax_rate',
      header: 'Rate (%)',
      sortable: true,
      render: (value: number) => `${value}%`,
    },
    {
      key: 'tax_type',
      header: 'Type',
      sortable: true,
      render: (value: string) => value.replace('_', ' ').toUpperCase(),
    },
    {
      key: 'apply_to',
      header: 'Applies To',
      sortable: true,
      render: (value: string) => value.charAt(0).toUpperCase() + value.slice(1),
    },
    {
      key: 'is_default',
      header: 'Default',
      sortable: true,
      render: (value: boolean) => (value ? 'Yes' : 'No'),
    },
    {
      key: 'is_active',
      header: 'Status',
      sortable: true,
      render: (value: boolean) => (
        <span style={{ color: value ? '#107c10' : '#d13438' }}>
          {value ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_: any, row: TaxSetting) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button size="small" variant="outline" onClick={() => handleEdit(row)}>
            Edit
          </Button>
          <Button
            size="small"
            variant="outline"
            onClick={() => handleDelete(row.id!)}
            style={{ color: '#d13438' }}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  if (loading) {
    return <LoadingSpinner variant="page" />;
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h1>Tax Settings</h1>
        {!showForm && (
          <Button variant="primary" onClick={() => setShowForm(true)}>
            Add Tax Setting
          </Button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ marginBottom: '24px' }}>
          <div
            style={{
              background: '#f5f5f5',
              padding: '24px',
              borderRadius: '8px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
            }}
          >
            <FormInput
              label="Tax Name"
              name="tax_name"
              value={formData.tax_name}
              onChange={(value) => updateField('tax_name', value)}
              required
              error={errors.tax_name}
              placeholder="e.g., GST, VAT, Sales Tax"
            />
            <FormInput
              label="Tax Code"
              name="tax_code"
              value={formData.tax_code}
              onChange={(value) => updateField('tax_code', value)}
              required
              error={errors.tax_code}
              placeholder="e.g., GST18, VAT5"
            />
            <FormNumberInput
              label="Tax Rate (%)"
              name="tax_rate"
              value={formData.tax_rate}
              onChange={(value) => updateField('tax_rate', value || 0)}
              required
              error={errors.tax_rate}
              min={0}
              max={100}
              decimals={2}
            />
            <FormSelect
              label="Tax Type"
              name="tax_type"
              value={formData.tax_type}
              onChange={(value) => updateField('tax_type', value as TaxSetting['tax_type'])}
              options={[
                { value: 'gst', label: 'GST' },
                { value: 'vat', label: 'VAT' },
                { value: 'sales_tax', label: 'Sales Tax' },
                { value: 'service_tax', label: 'Service Tax' },
                { value: 'other', label: 'Other' },
              ]}
            />
            <FormSelect
              label="Applies To"
              name="apply_to"
              value={formData.apply_to}
              onChange={(value) => updateField('apply_to', value as TaxSetting['apply_to'])}
              options={[
                { value: 'both', label: 'Both Sales & Purchases' },
                { value: 'sales', label: 'Sales Only' },
                { value: 'purchases', label: 'Purchases Only' },
              ]}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={formData.is_compound}
                  onChange={(e) => updateField('is_compound', e.target.checked)}
                />
                Compound Tax
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={formData.is_default}
                  onChange={(e) => updateField('is_default', e.target.checked)}
                />
                Set as Default
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => updateField('is_active', e.target.checked)}
                />
                Active
              </label>
            </div>
          </div>
          <div
            style={{ marginTop: '16px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}
          >
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingId ? 'Update' : 'Create'} Tax Setting
            </Button>
          </div>
        </form>
      )}

      <DataGrid columns={columns} data={taxSettings} searchable />
    </div>
  );
}
