import React from 'react';
import { formatCurrency } from '../../../shared/utils/formatting';
import type { ProductSales } from '../services/DashboardService';
import './TopProductsWidget.css';

export interface TopProductsWidgetProps {
  products: ProductSales[];
}

export const TopProductsWidget: React.FC<TopProductsWidgetProps> = ({ products }) => {
  return (
    <div className="top-products-widget">
      <div className="widget-header">
        <h3>Top Products</h3>
      </div>
      <div className="widget-content">
        {products.length === 0 ? (
          <div className="widget-empty">No sales data available</div>
        ) : (
          <div className="products-list">
            {products.map((product, index) => (
              <div key={product.product_id} className="product-item">
                <div className="product-rank">#{index + 1}</div>
                <div className="product-info">
                  <div className="product-name">{product.product_name}</div>
                  <div className="product-stats">
                    <span>Qty: {product.quantity_sold}</span>
                    <span className="product-revenue">{formatCurrency(product.revenue)}</span>
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

export default TopProductsWidget;
