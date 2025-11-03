import React from 'react';
import { Modal } from './Modal';
import { Button } from '../../renderer/components/ui/Button';
import { Alert24Regular, Warning24Regular, Info24Regular } from '@fluentui/react-icons';

export type ConfirmVariant = 'danger' | 'warning' | 'info';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  variant?: ConfirmVariant;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  variant = 'info',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  loading = false,
}) => {
  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return <Alert24Regular style={{ color: '#d13438' }} />;
      case 'warning':
        return <Warning24Regular style={{ color: '#ff9800' }} />;
      default:
        return <Info24Regular style={{ color: '#0078d4' }} />;
    }
  };

  const footer = (
    <>
      <Button variant="outline" onClick={onClose} disabled={loading}>
        {cancelLabel}
      </Button>
      <Button
        variant={variant === 'danger' ? 'danger' : 'primary'}
        onClick={onConfirm}
        loading={loading}
      >
        {confirmLabel}
      </Button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm" footer={footer}>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        <div style={{ marginTop: '4px' }}>{getIcon()}</div>
        <p style={{ margin: 0, color: '#616161', lineHeight: '1.5' }}>{message}</p>
      </div>
    </Modal>
  );
};

