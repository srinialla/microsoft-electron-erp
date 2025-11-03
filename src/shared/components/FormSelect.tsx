import React from 'react';
import { Field, Select } from '@fluentui/react-components';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface FormSelectProps {
  label: string;
  name: string;
  value: string | number | undefined;
  onChange: (value: string | number | undefined) => void;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  error?: string;
  helpText?: string;
  disabled?: boolean;
}

export const FormSelect: React.FC<FormSelectProps> = ({
  label,
  name,
  value,
  onChange,
  options,
  placeholder = 'Select...',
  required = false,
  error,
  helpText,
  disabled = false,
}) => {
  return (
    <Field
      label={required ? `${label} *` : label}
      validationMessage={error}
      validationState={error ? 'error' : 'none'}
    >
      <Select
        id={name}
        value={value?.toString()}
        onChange={(_, data) => onChange(data.value === '' ? undefined : data.value)}
        disabled={disabled}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </Select>
      {helpText && !error && <div className="form-help-text">{helpText}</div>}
    </Field>
  );
};

