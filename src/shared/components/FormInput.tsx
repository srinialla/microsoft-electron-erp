import React from 'react';
import { Field } from '@fluentui/react-components';
import './FormInput.css';

export interface FormInputProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'password' | 'tel' | 'url';
  placeholder?: string;
  required?: boolean;
  error?: string;
  helpText?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  maxLength?: number;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  name,
  value,
  onChange,
  type = 'text',
  placeholder,
  required = false,
  error,
  helpText,
  disabled = false,
  autoFocus = false,
  maxLength,
}) => {
  return (
    <Field
      label={required ? `${label} *` : label}
      validationMessage={error}
      validationState={error ? 'error' : 'none'}
    >
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        autoFocus={autoFocus}
        maxLength={maxLength}
        className="form-input"
      />
      {helpText && !error && <div className="form-help-text">{helpText}</div>}
    </Field>
  );
};

