import React from 'react';
import { Field, Checkbox } from '@fluentui/react-components';

export interface FormCheckboxProps {
  label: string;
  name: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  required?: boolean;
  error?: string;
  helpText?: string;
  disabled?: boolean;
}

export const FormCheckbox: React.FC<FormCheckboxProps> = ({
  label,
  name,
  checked,
  onChange,
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
      <Checkbox
        id={name}
        name={name}
        checked={checked}
        onChange={(_, data) => onChange(data.checked === true)}
        disabled={disabled}
        label={label}
      />
      {helpText && !error && <div className="form-help-text">{helpText}</div>}
    </Field>
  );
};

