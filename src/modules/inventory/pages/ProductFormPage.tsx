import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../../renderer/components/ui/Button';
import {
  FormInput,
  FormSelect,
  FormTextarea,
  FormCheckbox,
  FormNumberInput,
  FormCurrency,
} from '../../../shared/components';
import ProductService, { type ProductFormData } from '../services/ProductService';
import { useToastController, useId } from '@fluentui/react-components';
import { LoadingSpinner } from '../../../shared/components';
import type { ProductCategory, ProductBrand, UnitOfMeasure } from '../../../shared/types/entities';

export default function ProductFormPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const toasterId = useId('toaster');
  const { dispatchToast } = useToastController(toasterId);
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    product_type: 'physical',
    cost_price: 0,
    selling_price: 0,
    track_inventory: true,
    tax_preference: 'taxable',
    status: 'active',
  });

  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [brands, setBrands] = useState<ProductBrand[]>([]);
  const [units, setUnits] = useState<UnitOfMeasure[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadOptions();
    if (isEdit && id) {
      loadProduct(parseInt(id));
    }
  }, [id, isEdit]);

  const loadOptions = async () => {
    try {
      const [cats, brds, uoms] = await Promise.all([
        ProductService.getCategories(),
        ProductService.getBrands(),
        ProductService.getUnitsOfMeasure(),
      ]);
      setCategories(cats);
      setBrands(brds);
      setUnits(uoms);
    } catch (error) {
      console.error('Failed to load options:', error);
    }
  };

  const loadProduct = async (productId: number) => {
    try {
      setLoading(true);
      const product = await ProductService.getProductById(productId);
      if (product) {
        setFormData({
          product_code: product.product_code,
          barcode: product.barcode,
          sku: product.sku,
          name: product.name,
          description: product.description,
          category_id: product.category_id,
          brand_id: product.brand_id,
          product_type: product.product_type,
          cost_price: product.cost_price,
          selling_price: product.selling_price,
          mrp: product.mrp,
          wholesale_price: product.wholesale_price,
          track_inventory: product.track_inventory,
          unit_of_measure_id: product.unit_of_measure_id,
          reorder_level: product.reorder_level,
          reorder_quantity: product.reorder_quantity,
          tax_preference: product.tax_preference,
          tax_rate: product.tax_rate,
          hsn_sac_code: product.hsn_sac_code,
          weight: product.weight,
          weight_unit: product.weight_unit,
          length: product.length,
          width: product.width,
          height: product.height,
          dimension_unit: product.dimension_unit,
          primary_image_url: product.primary_image_url,
          additional_images: product.additional_images,
          preferred_vendor_id: product.preferred_vendor_id,
          tags: product.tags,
          notes: product.notes,
          status: product.status,
        });
      }
    } catch (error) {
      dispatchToast(<div>Failed to load product: {(error as Error).message}</div>, {
        intent: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (formData.cost_price === undefined || formData.cost_price < 0) {
      newErrors.cost_price = 'Cost price must be 0 or greater';
    }

    if (formData.selling_price === undefined || formData.selling_price < 0) {
      newErrors.selling_price = 'Selling price must be 0 or greater';
    }

    if (formData.tax_preference === 'taxable' && formData.tax_rate === undefined) {
      newErrors.tax_rate = 'Tax rate is required for taxable products';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      dispatchToast(<div>Please fix the errors in the form</div>, { intent: 'error' });
      return;
    }

    try {
      setLoading(true);

      if (isEdit && id) {
        await ProductService.updateProduct(parseInt(id), formData);
        dispatchToast(<div>Product updated successfully</div>, { intent: 'success' });
      } else {
        await ProductService.createProduct(formData);
        dispatchToast(<div>Product created successfully</div>, { intent: 'success' });
      }

      navigate('/inventory/product-list');
    } catch (error) {
      dispatchToast(<div>Failed to save product: {(error as Error).message}</div>, {
        intent: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateField = <K extends keyof ProductFormData>(field: K, value: ProductFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  if (loading && isEdit) {
    return <LoadingSpinner variant="page" />;
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1>{isEdit ? 'Edit Product' : 'New Product'}</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Basic Information */}
          <div style={{ gridColumn: '1 / -1' }}>
            <h2>Basic Information</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {isEdit && (
                <FormInput
                  label="Product Code"
                  name="product_code"
                  value={formData.product_code || ''}
                  onChange={(value) => updateField('product_code', value)}
                  disabled
                />
              )}
              <FormInput
                label="Product Name"
                name="name"
                value={formData.name}
                onChange={(value) => updateField('name', value)}
                required
                error={errors.name}
              />
              <FormInput
                label="Barcode"
                name="barcode"
                value={formData.barcode || ''}
                onChange={(value) => updateField('barcode', value)}
              />
              <FormInput
                label="SKU"
                name="sku"
                value={formData.sku || ''}
                onChange={(value) => updateField('sku', value)}
              />
              <FormSelect
                label="Product Type"
                name="product_type"
                value={formData.product_type}
                onChange={(value) =>
                  updateField('product_type', value as 'physical' | 'service' | 'digital')
                }
                options={[
                  { value: 'physical', label: 'Physical' },
                  { value: 'service', label: 'Service' },
                  { value: 'digital', label: 'Digital' },
                ]}
                required
              />
              <FormSelect
                label="Category"
                name="category_id"
                value={formData.category_id}
                onChange={(value) => updateField('category_id', value as number | undefined)}
                options={categories.map((cat) => ({ value: cat.id, label: cat.name }))}
                placeholder="Select category"
              />
              <FormSelect
                label="Brand"
                name="brand_id"
                value={formData.brand_id}
                onChange={(value) => updateField('brand_id', value as number | undefined)}
                options={brands.map((brand) => ({ value: brand.id, label: brand.name }))}
                placeholder="Select brand"
              />
              <FormTextarea
                label="Description"
                name="description"
                value={formData.description || ''}
                onChange={(value) => updateField('description', value)}
                rows={4}
              />
            </div>
          </div>

          {/* Pricing */}
          <div style={{ gridColumn: '1 / -1' }}>
            <h2>Pricing</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <FormCurrency
                label="Cost Price"
                name="cost_price"
                value={formData.cost_price}
                onChange={(value) => updateField('cost_price', value || 0)}
                required
                error={errors.cost_price}
                min={0}
              />
              <FormCurrency
                label="Selling Price"
                name="selling_price"
                value={formData.selling_price}
                onChange={(value) => updateField('selling_price', value || 0)}
                required
                error={errors.selling_price}
                min={0}
              />
              <FormCurrency
                label="MRP"
                name="mrp"
                value={formData.mrp}
                onChange={(value) => updateField('mrp', value)}
                min={0}
              />
              <FormCurrency
                label="Wholesale Price"
                name="wholesale_price"
                value={formData.wholesale_price}
                onChange={(value) => updateField('wholesale_price', value)}
                min={0}
              />
            </div>
          </div>

          {/* Inventory */}
          <div style={{ gridColumn: '1 / -1' }}>
            <h2>Inventory</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <FormCheckbox
                label="Track Inventory"
                name="track_inventory"
                checked={formData.track_inventory}
                onChange={(checked) => updateField('track_inventory', checked)}
              />
              {formData.track_inventory && (
                <>
                  <FormSelect
                    label="Unit of Measure"
                    name="unit_of_measure_id"
                    value={formData.unit_of_measure_id}
                    onChange={(value) =>
                      updateField('unit_of_measure_id', value as number | undefined)
                    }
                    options={units.map((uom) => ({
                      value: uom.id,
                      label: `${uom.unit_name} (${uom.unit_symbol})`,
                    }))}
                    placeholder="Select unit"
                  />
                  <FormNumberInput
                    label="Reorder Level"
                    name="reorder_level"
                    value={formData.reorder_level}
                    onChange={(value) => updateField('reorder_level', value)}
                    min={0}
                  />
                  <FormNumberInput
                    label="Reorder Quantity"
                    name="reorder_quantity"
                    value={formData.reorder_quantity}
                    onChange={(value) => updateField('reorder_quantity', value)}
                    min={0}
                  />
                </>
              )}
            </div>
          </div>

          {/* Tax */}
          <div style={{ gridColumn: '1 / -1' }}>
            <h2>Tax</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <FormSelect
                label="Tax Preference"
                name="tax_preference"
                value={formData.tax_preference}
                onChange={(value) =>
                  updateField('tax_preference', value as 'taxable' | 'non_taxable')
                }
                options={[
                  { value: 'taxable', label: 'Taxable' },
                  { value: 'non_taxable', label: 'Non-Taxable' },
                ]}
                required
              />
              {formData.tax_preference === 'taxable' && (
                <>
                  <FormNumberInput
                    label="Tax Rate (%)"
                    name="tax_rate"
                    value={formData.tax_rate}
                    onChange={(value) => updateField('tax_rate', value)}
                    required
                    error={errors.tax_rate}
                    min={0}
                    max={100}
                    decimals={2}
                  />
                  <FormInput
                    label="HSN/SAC Code"
                    name="hsn_sac_code"
                    value={formData.hsn_sac_code || ''}
                    onChange={(value) => updateField('hsn_sac_code', value)}
                  />
                </>
              )}
            </div>
          </div>

          {/* Dimensions & Weight */}
          {formData.product_type === 'physical' && (
            <div style={{ gridColumn: '1 / -1' }}>
              <h2>Dimensions & Weight</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <FormNumberInput
                  label="Weight"
                  name="weight"
                  value={formData.weight}
                  onChange={(value) => updateField('weight', value)}
                  min={0}
                />
                <FormInput
                  label="Weight Unit"
                  name="weight_unit"
                  value={formData.weight_unit || ''}
                  onChange={(value) => updateField('weight_unit', value)}
                  placeholder="kg, g, lb, oz"
                />
                <FormNumberInput
                  label="Length"
                  name="length"
                  value={formData.length}
                  onChange={(value) => updateField('length', value)}
                  min={0}
                />
                <FormNumberInput
                  label="Width"
                  name="width"
                  value={formData.width}
                  onChange={(value) => updateField('width', value)}
                  min={0}
                />
                <FormNumberInput
                  label="Height"
                  name="height"
                  value={formData.height}
                  onChange={(value) => updateField('height', value)}
                  min={0}
                />
                <FormInput
                  label="Dimension Unit"
                  name="dimension_unit"
                  value={formData.dimension_unit || ''}
                  onChange={(value) => updateField('dimension_unit', value)}
                  placeholder="cm, m, inch"
                />
              </div>
            </div>
          )}

          {/* Additional */}
          <div style={{ gridColumn: '1 / -1' }}>
            <h2>Additional</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <FormInput
                label="Primary Image URL"
                name="primary_image_url"
                value={formData.primary_image_url || ''}
                onChange={(value) => updateField('primary_image_url', value)}
                type="url"
              />
              <FormInput
                label="Tags"
                name="tags"
                value={formData.tags || ''}
                onChange={(value) => updateField('tags', value)}
                helpText="Comma-separated tags"
              />
              <FormTextarea
                label="Notes"
                name="notes"
                value={formData.notes || ''}
                onChange={(value) => updateField('notes', value)}
                rows={4}
              />
              <FormSelect
                label="Status"
                name="status"
                value={formData.status}
                onChange={(value) => updateField('status', value as 'active' | 'inactive')}
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                ]}
              />
            </div>
          </div>
        </div>

        <div
          style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}
        >
          <Button
            variant="outline"
            onClick={() => navigate('/inventory/product-list')}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            {isEdit ? 'Update' : 'Create'} Product
          </Button>
        </div>
      </form>
    </div>
  );
}
