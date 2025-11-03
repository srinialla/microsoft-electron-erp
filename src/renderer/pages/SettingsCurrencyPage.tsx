import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { FormSelect } from '../../shared/components';
import SettingsService from '../../modules/settings/services/SettingsService';
import { useCurrencyStore } from '../stores/currency';
import { useToastController, useId } from '@fluentui/react-components';
import { LoadingSpinner } from '../../shared/components';
import { formatCurrency } from '../../shared/utils/formatting';

export default function SettingsCurrencyPage() {
  const toasterId = useId('toaster');
  const { dispatchToast } = useToastController(toasterId);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const currency = useCurrencyStore((s) => s.currency);
  const setCurrency = useCurrencyStore((s) => s.setCurrency);
  const loadCurrency = useCurrencyStore((s) => s.loadCurrency);

  const [selectedCurrency, setSelectedCurrency] = useState(currency);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setSelectedCurrency(currency);
  }, [currency]);

  const loadData = async () => {
    try {
      setLoading(true);
      await loadCurrency();
      const company = await SettingsService.getCompany();
      if (company?.currency) {
        setSelectedCurrency(company.currency);
      }
    } catch (error) {
      dispatchToast(<div>Failed to load currency settings: {(error as Error).message}</div>, {
        intent: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await setCurrency(selectedCurrency);
      dispatchToast(<div>Currency updated successfully</div>, { intent: 'success' });
      // Reload to ensure consistency
      window.location.reload();
    } catch (error) {
      dispatchToast(<div>Failed to save currency: {(error as Error).message}</div>, {
        intent: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const currencies = [
    { value: 'INR', label: 'INR - Indian Rupee (₹)' },
    { value: 'USD', label: 'USD - US Dollar ($)' },
    { value: 'EUR', label: 'EUR - Euro (€)' },
    { value: 'GBP', label: 'GBP - British Pound (£)' },
    { value: 'JPY', label: 'JPY - Japanese Yen (¥)' },
    { value: 'CNY', label: 'CNY - Chinese Yuan (¥)' },
    { value: 'AUD', label: 'AUD - Australian Dollar (A$)' },
    { value: 'CAD', label: 'CAD - Canadian Dollar (C$)' },
    { value: 'SGD', label: 'SGD - Singapore Dollar (S$)' },
    { value: 'AED', label: 'AED - UAE Dirham (د.إ)' },
  ];

  if (loading) {
    return <LoadingSpinner variant="page" />;
  }

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '24px' }}>Currency Settings</h1>

      <div
        style={{
          background: '#f5f5f5',
          padding: '24px',
          borderRadius: '8px',
          marginBottom: '24px',
        }}
      >
        <div style={{ marginBottom: '24px' }}>
          <h2>Current Currency</h2>
          <p style={{ fontSize: '18px', fontWeight: 600, color: '#0078d4' }}>
            {selectedCurrency} -{' '}
            {currencies
              .find((c) => c.value === selectedCurrency)
              ?.label.split('(')[0]
              .trim()}
          </p>
          <p style={{ fontSize: '16px', marginTop: '8px', color: '#616161' }}>
            Example: {formatCurrency(1234.56, selectedCurrency)}
          </p>
        </div>

        <FormSelect
          label="Select Currency"
          name="currency"
          value={selectedCurrency}
          onChange={(value) => setSelectedCurrency(value as string)}
          options={currencies}
          required
        />

        <div
          style={{
            background: '#fff3cd',
            padding: '16px',
            borderRadius: '4px',
            marginTop: '24px',
            border: '1px solid #ffc107',
          }}
        >
          <p style={{ margin: 0, fontSize: '14px', color: '#856404' }}>
            <strong>Note:</strong> Changing the currency will affect all currency formatting
            throughout the application. This change will apply immediately to all new transactions
            and displays.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <Button variant="primary" onClick={handleSave} loading={saving}>
          Save Currency Settings
        </Button>
      </div>
    </div>
  );
}
