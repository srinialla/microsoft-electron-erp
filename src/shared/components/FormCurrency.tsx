import React from 'react';
import { Field } from '@fluentui/react-components';
import { formatCurrency } from '../utils/formatting';

// Try to import currency store if available (renderer-only)
let useCurrencyStore: any = null;
try {
  useCurrencyStore = require('../../renderer/stores/currency').useCurrencyStore;
} catch (e) {
  // Not available in shared context, will use prop/default
}

import './FormCurrency.css';

export interface FormCurrencyProps {
  label: string;
  name: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  currency?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  helpText?: string;
  disabled?: boolean;
  min?: number;
}

export const FormCurrency: React.FC<FormCurrencyProps> = ({
  label,
  name,
  value,
  onChange,
  currency: propCurrency,
  placeholder,
  required = false,
  error,
  helpText,
  disabled = false,
  min,
}) => {
  // Try to get currency from store, fallback to prop or default
  let currency = propCurrency;
  if (!currency && useCurrencyStore) {
    try {
      currency = useCurrencyStore((s: any) => s.currency) || 'INR';
    } catch (e) {
      currency = 'INR';
    }
  }
  currency = currency || 'INR';
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9.]/g, '');
    if (val === '' || val === undefined) {
      onChange(undefined);
      return;
    }
    const num = parseFloat(val);
    if (!isNaN(num)) {
      onChange(num);
    }
  };

  const displayValue = value !== undefined ? value.toFixed(2) : '';

  return (
    <Field
      label={required ? `${label} *` : label}
      validationMessage={error}
      validationState={error ? 'error' : 'none'}
    >
      <div className="form-currency-wrapper">
        <span className="form-currency-symbol">
          {currency === 'USD'
            ? '$'
            : currency === 'INR'
              ? '₹'
              : currency === 'EUR'
                ? '€'
                : currency === 'GBP'
                  ? '£'
                  : currency}
        </span>
        <input
          type="text"
          id={name}
          name={name}
          value={displayValue}
          onChange={handleChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          min={min}
          className="form-input form-currency-input"
        />
      </div>
      {value !== undefined && (
        <div className="form-currency-preview">{formatCurrency(value, currency)}</div>
      )}
      {helpText && !error && <div className="form-help-text">{helpText}</div>}
    </Field>
  );
};
