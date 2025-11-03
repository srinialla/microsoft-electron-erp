import type { ButtonProps as FluentButtonProps } from '@fluentui/react-components';
import type React from 'react';

export interface ButtonProps extends Omit<FluentButtonProps, 'size'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'subtle' | 'transparent';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'start' | 'end';
  fullWidth?: boolean;
  tooltip?: string;
}
