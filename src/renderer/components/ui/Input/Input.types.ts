import type { InputProps as FluentInputProps } from '@fluentui/react-components';
import type React from 'react';

export interface InputProps extends Omit<FluentInputProps, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  maxLength?: number;
  showCount?: boolean;
}
