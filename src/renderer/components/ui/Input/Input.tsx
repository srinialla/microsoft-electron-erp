import React from 'react';
import { Field, Input as FInput, Text } from '@fluentui/react-components';
import type { InputProps } from './Input.types';

export const Input = React.forwardRef<HTMLInputElement, InputProps>((props, ref) => {
  const { label, error, helperText, prefix, suffix, maxLength, showCount, required, ...rest } = props;
  const [value, setValue] = React.useState(rest.value?.toString() ?? '');

  const onChange = (_: any, data: { value: string }) => {
    setValue(data.value);
    rest.onChange?.(_, data as any);
  };

  return (
    <Field label={label} validationMessage={error} validationState={error ? 'error' : undefined} required={required}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {prefix}
        <FInput ref={ref} value={value} onChange={onChange} {...rest} />
        {suffix}
      </div>
      {helperText && <Text size={200}>{helperText}</Text>}
      {showCount && maxLength && (
        <Text size={200} style={{ justifySelf: 'end' }}>{`${value.length}/${maxLength}`}</Text>
      )}
    </Field>
  );
});

Input.displayName = 'Input';
