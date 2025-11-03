import React from 'react';
import { Field } from '@fluentui/react-components';
import './FormDatePicker.css';

export interface FormDatePickerProps {
  label: string;
  name: string;
  value: Date | undefined;
  onChange: (value: Date | undefined) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  helpText?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
}

export const FormDatePicker: React.FC<FormDatePickerProps> = ({
  label,
  name,
  value,
  onChange,
  placeholder = 'Select date...',
  required = false,
  error,
  helpText,
  disabled = false,
  minDate,
  maxDate,
}) => {
  const formatDateForInput = (date: Date | undefined): string => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateString = e.target.value;
    if (dateString) {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        onChange(date);
      }
    } else {
      onChange(undefined);
    }
  };

  return (
    <Field
      label={required ? `${label} *` : label}
      validationMessage={error}
      validationState={error ? 'error' : 'none'}
    >
      <input
        type="date"
        id={name}
        name={name}
        value={formatDateForInput(value)}
        onChange={handleChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        min={minDate ? formatDateForInput(minDate) : undefined}
        max={maxDate ? formatDateForInput(maxDate) : undefined}
        className="form-input"
      />
      {helpText && !error && <div className="form-help-text">{helpText}</div>}
    </Field>
  );
};
