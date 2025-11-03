import React from 'react';
import { Button as FButton, Tooltip, Spinner } from '@fluentui/react-components';
import { useButtonStyles } from './Button.styles';
import type { ButtonProps } from './Button.types';

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
  const { variant = 'primary', size = 'medium', loading, icon, iconPosition = 'start', fullWidth, tooltip, children, ...rest } = props;
  const classes = useButtonStyles();

  const content = (
    <FButton
      ref={ref}
      appearance={variant === 'primary' ? 'primary' : variant === 'secondary' ? 'secondary' : variant === 'outline' ? 'outline' : variant === 'subtle' ? 'subtle' : 'transparent'}
      size={size}
      icon={iconPosition === 'start' ? (loading ? <Spinner size="extra-tiny" /> : icon) : undefined}
      iconPosition={iconPosition}
      className={`${classes.root} ${fullWidth ? classes.fullWidth : ''}`}
      {...rest}
    >
      {children}
      {iconPosition === 'end' && (loading ? <Spinner size="extra-tiny" /> : icon)}
    </FButton>
  );

  return tooltip ? (
    <Tooltip content={tooltip} relationship="label">
      {content}
    </Tooltip>
  ) : (
    content
  );
});

Button.displayName = 'Button';
