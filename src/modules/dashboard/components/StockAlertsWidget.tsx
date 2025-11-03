import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert24Regular } from '@fluentui/react-icons';
import type { Product } from '../../../shared/types/entities';
import './StockAlertsWidget.css';

export interface StockAlertsWidgetProps {
  products: (Product & { available_stock: number; reorder_level: number })[];
  onViewAll?: () => void;
}

export const StockAlertsWidget: React.FC<StockAlertsWidgetProps> = ({ products, onViewAll }) => {
  const navigate = useNavigate();

  return (
    <div className="stock-alerts-widget">
      <div className="widget-header">
        <h3>Low Stock Alerts</h3>
        {onViewAll && (
          <button className="widget-view-all" onClick={onViewAll}>
            View All
          </button>
        )}
      </div>
      <div className="widget-content">
        {products.length === 0 ? (
          <div className="widget-empty">All products are well stocked</div>
        ) : (
          <div className="alerts-list">
            {products.map((product) => (
              <div
                key={product.id}
                className="alert-item"
                onClick={() => navigate(`/inventory/product/view/${product.id}`)}
              >
                <Alert24Regular className="alert-icon" />
                <div className="alert-info">
                  <div className="alert-product-name">{product.name}</div>
                  <div className="alert-stock-info">
                    Stock: {product.available_stock} / Reorder: {product.reorder_level}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StockAlertsWidget;
