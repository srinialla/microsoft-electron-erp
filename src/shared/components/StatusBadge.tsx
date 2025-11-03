import React from 'react';
import './StatusBadge.css';

export type StatusType =
  | 'draft'
  | 'pending'
  | 'approved'
  | 'confirmed'
  | 'processing'
  | 'completed'
  | 'paid'
  | 'delivered'
  | 'cancelled'
  | 'rejected'
  | 'overdue';

export interface StatusBadgeProps {
  status: StatusType | string;
  label?: string;
  pulse?: boolean;
}

const statusConfig: Record<string, { color: string; bgColor: string }> = {
  draft: { color: '#616161', bgColor: '#f5f5f5' },
  pending: { color: '#616161', bgColor: '#f5f5f5' },
  approved: { color: '#0078d4', bgColor: '#e3f2fd' },
  confirmed: { color: '#0078d4', bgColor: '#e3f2fd' },
  processing: { color: '#ff9800', bgColor: '#fff3e0' },
  completed: { color: '#107c10', bgColor: '#e8f5e9' },
  paid: { color: '#107c10', bgColor: '#e8f5e9' },
  delivered: { color: '#107c10', bgColor: '#e8f5e9' },
  cancelled: { color: '#d13438', bgColor: '#ffebee' },
  rejected: { color: '#d13438', bgColor: '#ffebee' },
  overdue: { color: '#d13438', bgColor: '#ffebee' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, pulse = false }) => {
  const config = statusConfig[status.toLowerCase()] || { color: '#616161', bgColor: '#f5f5f5' };
  const displayLabel = label || status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <span
      className={`status-badge ${pulse ? 'status-badge-pulse' : ''}`}
      style={{
        color: config.color,
        backgroundColor: config.bgColor,
      }}
    >
      {displayLabel}
    </span>
  );
};

