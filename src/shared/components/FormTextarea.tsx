import React from 'react';
import { Field } from '@fluentui/react-components';
import './FormTextarea.css';

export interface FormTextareaProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  helpText?: string;
  disabled?: boolean;
  rows?: number;
  maxLength?: number;
}

export const FormTextarea: React.FC<FormTextareaProps> = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  error,
  helpText,
  disabled = false,
  rows = 4,
  maxLength,
}) => {
  return (
    <Field
      label={required ? `${label} *` : label}
      validationMessage={error}
      validationState={error ? 'error' : 'none'}
    >
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        rows={rows}
        maxLength={maxLength}
        className="form-textarea"
      />
      {maxLength && (
        <div className="form-textarea-counter">
          {value.length} / {maxLength}
        </div>
      )}
      {helpText && !error && <div className="form-help-text">{helpText}</div>}
    </Field>
  );
};

