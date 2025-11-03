import React from 'react';
import { Field } from '@fluentui/react-components';
import './FormNumberInput.css';

export interface FormNumberInputProps {
  label: string;
  name: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  helpText?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
  decimals?: number;
}

export const FormNumberInput: React.FC<FormNumberInputProps> = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  error,
  helpText,
  disabled = false,
  min,
  max,
  step = 1,
  decimals,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '' || val === undefined) {
      onChange(undefined);
      return;
    }
    const num = parseFloat(val);
    if (!isNaN(num)) {
      onChange(num);
    }
  };

  const displayValue = value !== undefined ? (decimals ? value.toFixed(decimals) : value.toString()) : '';

  return (
    <Field
      label={required ? `${label} *` : label}
      validationMessage={error}
      validationState={error ? 'error' : 'none'}
    >
      <input
        type="number"
        id={name}
        name={name}
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        className="form-input"
      />
      {helpText && !error && <div className="form-help-text">{helpText}</div>}
    </Field>
  );
};

