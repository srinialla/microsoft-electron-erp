import React from 'react';
import { Spinner } from '@fluentui/react-components';
import './LoadingSpinner.css';

export type LoadingSpinnerVariant = 'inline' | 'page' | 'overlay';

export interface LoadingSpinnerProps {
  variant?: LoadingSpinnerVariant;
  size?: 'small' | 'medium' | 'large';
  label?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  variant = 'inline',
  size = 'medium',
  label = 'Loading...',
}) => {
  const spinnerSize =
    size === 'small' ? 'tiny' : size === 'large' ? 'large' : 'medium';

  if (variant === 'page') {
    return (
      <div className="loading-spinner-page">
        <Spinner size={spinnerSize} label={label} />
      </div>
    );
  }

  if (variant === 'overlay') {
    return (
      <div className="loading-spinner-overlay">
        <Spinner size={spinnerSize} label={label} />
      </div>
    );
  }

  return <Spinner size={spinnerSize} label={label} />;
};

