import React from 'react';
import type { SalesTrendData } from '../services/DashboardService';
import { formatCurrency } from '../../../shared/utils/formatting';
import './SalesChartWidget.css';

export interface SalesChartWidgetProps {
  data: SalesTrendData[];
  title?: string;
}

export const SalesChartWidget: React.FC<SalesChartWidgetProps> = ({
  data,
  title = 'Sales Trend',
}) => {
  const maxSales = Math.max(...data.map((d) => d.sales), 1);
  const maxHeight = 200;

  return (
    <div className="sales-chart-widget">
      <div className="widget-header">
        <h3>{title}</h3>
      </div>
      <div className="widget-content">
        {data.length === 0 ? (
          <div className="widget-empty">No sales data available</div>
        ) : (
          <div className="chart-container">
            <div className="chart-bars">
              {data.map((point, index) => {
                const height = (point.sales / maxSales) * maxHeight;
                return (
                  <div key={index} className="chart-bar-group">
                    <div
                      className="chart-bar"
                      style={{ height: `${height}px` }}
                      title={`${formatCurrency(point.sales)} - ${point.date}`}
                    />
                    <div className="chart-label">{new Date(point.date).getDate()}</div>
                  </div>
                );
              })}
            </div>
            <div className="chart-footer">
              <div className="chart-summary">
                <div>
                  <strong>Total:</strong>{' '}
                  {formatCurrency(data.reduce((sum, d) => sum + d.sales, 0))}
                </div>
                <div>
                  <strong>Avg/Day:</strong>{' '}
                  {formatCurrency(data.reduce((sum, d) => sum + d.sales, 0) / data.length)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesChartWidget;
