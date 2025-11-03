import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../renderer/components/ui/Button';
import { FormInput, FormTextarea, FormSelect } from '../../../shared/components';
import ProductService from '../services/ProductService';
import { useToastController, useId } from '@fluentui/react-components';
import { ArrowUpload24Regular } from '@fluentui/react-icons';

interface ImportData {
  name: string;
  product_code?: string;
  cost_price: number;
  selling_price: number;
  quantity?: number;
}

export default function ImportProductsPage() {
  const navigate = useNavigate();
  const toasterId = useId('toaster');
  const { dispatchToast } = useToastController(toasterId);

  const [loading, setLoading] = useState(false);
  const [importData, setImportData] = useState('');
  const [importFormat, setImportFormat] = useState<'csv' | 'json'>('csv');
  const [preview, setPreview] = useState<ImportData[]>([]);

  const parseCSV = (text: string): ImportData[] => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const data: ImportData[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim());
      const row: any = {};

      headers.forEach((header, index) => {
        if (header === 'name' || header === 'product_name') row.name = values[index] || '';
        if (header === 'product_code' || header === 'code')
          row.product_code = values[index] || undefined;
        if (header === 'cost_price' || header === 'cost')
          row.cost_price = parseFloat(values[index]) || 0;
        if (header === 'selling_price' || header === 'price')
          row.selling_price = parseFloat(values[index]) || 0;
        if (header === 'quantity' || header === 'qty')
          row.quantity = parseFloat(values[index]) || 0;
      });

      if (row.name) {
        data.push(row);
      }
    }

    return data;
  };

  const parseJSON = (text: string): ImportData[] => {
    try {
      const data = JSON.parse(text);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  };

  const handleParse = () => {
    if (!importData.trim()) {
      dispatchToast(<div>Please enter import data</div>, { intent: 'warning' });
      return;
    }

    try {
      const parsed = importFormat === 'csv' ? parseCSV(importData) : parseJSON(importData);
      setPreview(parsed);
      if (parsed.length === 0) {
        dispatchToast(<div>No valid data found. Please check the format.</div>, {
          intent: 'warning',
        });
      }
    } catch (error) {
      dispatchToast(<div>Failed to parse data: {(error as Error).message}</div>, {
        intent: 'error',
      });
    }
  };

  const handleImport = async () => {
    if (preview.length === 0) {
      dispatchToast(<div>No products to import</div>, { intent: 'warning' });
      return;
    }

    try {
      setLoading(true);
      let imported = 0;
      let skipped = 0;

      for (const item of preview) {
        try {
          await ProductService.createProduct({
            name: item.name,
            product_code: item.product_code,
            product_type: 'physical',
            cost_price: item.cost_price,
            selling_price: item.selling_price,
            track_inventory: true,
            tax_preference: 'taxable',
            status: 'active',
          });
          imported++;
        } catch (error) {
          skipped++;
          console.error(`Failed to import ${item.name}:`, error);
        }
      }

      dispatchToast(
        <div>
          Successfully imported {imported} products{skipped > 0 && ` (${skipped} skipped)`}
        </div>,
        { intent: 'success' },
      );

      setImportData('');
      setPreview([]);
      navigate('/inventory/product-list');
    } catch (error) {
      dispatchToast(<div>Failed to import products: {(error as Error).message}</div>, {
        intent: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const csvExample = `name,product_code,cost_price,selling_price,quantity
Product 1,PROD-001,10.00,15.00,100
Product 2,PROD-002,20.00,30.00,50`;

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        <h1>Import Products</h1>
        <Button variant="outline" onClick={() => navigate('/inventory/product-list')}>
          Back to Products
        </Button>
      </div>

      <div
        style={{
          background: '#f5f5f5',
          padding: '24px',
          borderRadius: '8px',
          marginBottom: '24px',
        }}
      >
        <h3 style={{ marginTop: 0 }}>Import Format</h3>
        <p>
          Import products in CSV or JSON format. Required fields: name, cost_price, selling_price
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            marginTop: '16px',
          }}
        >
          <FormSelect
            label="Import Format"
            name="importFormat"
            value={importFormat}
            onChange={(value) => setImportFormat(value as 'csv' | 'json')}
            options={[
              { value: 'csv', label: 'CSV' },
              { value: 'json', label: 'JSON' },
            ]}
          />
        </div>

        <div style={{ marginTop: '16px' }}>
          <FormTextarea
            label="Import Data"
            name="importData"
            value={importData}
            onChange={setImportData}
            rows={10}
            placeholder={
              importFormat === 'csv'
                ? csvExample
                : '[\n  {"name": "Product 1", "cost_price": 10, "selling_price": 15}\n]'
            }
          />
        </div>

        <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
          <Button variant="primary" onClick={handleParse} disabled={!importData.trim()}>
            Parse Data
          </Button>
        </div>
      </div>

      {preview.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}
          >
            <h2>Preview ({preview.length} products)</h2>
            <Button
              variant="primary"
              onClick={handleImport}
              loading={loading}
              icon={<ArrowUpload24Regular />}
            >
              Import {preview.length} Products
            </Button>
          </div>

          <div style={{ border: '1px solid #e1e1e1', borderRadius: '4px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f5f5f5' }}>
                <tr>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Name</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Code</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>
                    Cost Price
                  </th>
                  <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>
                    Selling Price
                  </th>
                  <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>Quantity</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((item, index) => (
                  <tr key={index} style={{ borderTop: '1px solid #f5f5f5' }}>
                    <td style={{ padding: '12px' }}>{item.name}</td>
                    <td style={{ padding: '12px' }}>{item.product_code || '-'}</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      ${item.cost_price.toFixed(2)}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      ${item.selling_price.toFixed(2)}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>{item.quantity || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div
        style={{ background: '#fff4e6', padding: '16px', borderRadius: '4px', marginTop: '24px' }}
      >
        <h4 style={{ marginTop: 0 }}>CSV Format Guidelines</h4>
        <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
          <li>
            First row must contain headers: name, product_code (optional), cost_price,
            selling_price, quantity (optional)
          </li>
          <li>Product code will be auto-generated if not provided</li>
          <li>All products will be created as physical products with inventory tracking enabled</li>
          <li>Duplicate product codes will be skipped</li>
        </ul>
      </div>
    </div>
  );
}
