import React from 'react';
import { Button } from '../../../renderer/components/ui/Button';
import './QuickActionCard.css';

export interface QuickActionCardProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  onClick: () => void;
  color?: 'blue' | 'green' | 'orange' | 'purple';
}

export const QuickActionCard: React.FC<QuickActionCardProps> = ({
  title,
  description,
  icon,
  onClick,
  color = 'blue',
}) => {
  return (
    <div className={`quick-action-card quick-action-card-${color}`} onClick={onClick}>
      <div className="quick-action-card-icon">{icon}</div>
      <div className="quick-action-card-content">
        <h3 className="quick-action-card-title">{title}</h3>
        {description && <p className="quick-action-card-description">{description}</p>}
        <Button variant="primary" size="medium" style={{ marginTop: '12px' }}>
          {title}
        </Button>
      </div>
    </div>
  );
};

export default QuickActionCard;
