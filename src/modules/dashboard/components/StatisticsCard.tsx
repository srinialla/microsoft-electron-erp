import React from 'react';
import {
  Money24Regular,
  People24Regular,
  Box24Regular,
  Alert24Regular,
} from '@fluentui/react-icons';
import { formatCurrency } from '../../../shared/utils/formatting';
import './StatisticsCard.css';

export interface StatisticsCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    label: string;
    isPositive?: boolean;
  };
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple';
  onClick?: () => void;
}

export const StatisticsCard: React.FC<StatisticsCardProps> = ({
  title,
  value,
  icon,
  trend,
  color = 'blue',
  onClick,
}) => {
  const displayValue =
    typeof value === 'number' && value >= 1000
      ? formatCurrency(value)
      : typeof value === 'number'
        ? value.toLocaleString()
        : value;

  return (
    <div
      className={`statistics-card statistics-card-${color} ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
    >
      <div className="statistics-card-content">
        <div className="statistics-card-icon">{icon}</div>
        <div className="statistics-card-info">
          <div className="statistics-card-title">{title}</div>
          <div className="statistics-card-value">{displayValue}</div>
          {trend && (
            <div className={`statistics-card-trend ${trend.isPositive ? 'positive' : 'negative'}`}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatisticsCard;
