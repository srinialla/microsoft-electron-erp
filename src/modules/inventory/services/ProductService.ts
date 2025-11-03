import type { DatabaseService } from '../../../services/database/interface/DatabaseService';
import { getDatabaseService } from '../../../services/database/DatabaseFactory';
import type {
    Product,
    ProductCategory,
    ProductBrand,
    UnitOfMeasure,
    InventoryStock,
} from '../../../shared/types/entities';
import { generateProductCode } from '../../../shared/utils/numberGenerator';

export interface ProductFormData {
    product_code?: string;
    barcode?: string;
    sku?: string;
    name: string;
    description?: string;
    category_id?: number;
    brand_id?: number;
    product_type: 'physical' | 'service' | 'digital';
    cost_price: number;
    selling_price: number;
    mrp?: number;
    wholesale_price?: number;
    track_inventory: boolean;
    unit_of_measure_id?: number;
    reorder_level?: number;
    reorder_quantity?: number;
    tax_preference: 'taxable' | 'non_taxable';
    tax_rate?: number;
    hsn_sac_code?: string;
    weight?: number;
    weight_unit?: string;
    length?: number;
    width?: number;
    height?: number;
    dimension_unit?: string;
    primary_image_url?: string;
    additional_images?: string;
    preferred_vendor_id?: number;
    tags?: string;
    notes?: string;
    status: 'active' | 'inactive';
}

export interface QueryOptions {
    search?: string;
    category_id?: number;
    brand_id?: number;
    product_type?: 'physical' | 'service' | 'digital';
    status?: 'active' | 'inactive';
    stock_status?: 'in_stock' | 'low_stock' | 'out_of_stock';
    limit?: number;
    offset?: number;
}

class ProductService {
    private db: DatabaseService;

    constructor() {
        this.db = getDatabaseService();
    }

    async createProduct(data: ProductFormData): Promise<number> {
        const productCode = data.product_code || (await generateProductCode(this.db));

        const productData: Omit<Product, 'id' | 'created_at' | 'updated_at'> = {
            product_code: productCode,
            barcode: data.barcode,
            sku: data.sku,
            name: data.name,
            description: data.description,
            category_id: data.category_id,
            brand_id: data.brand_id,
            product_type: data.product_type,
            cost_price: data.cost_price,
            selling_price: data.selling_price,
            mrp: data.mrp,
            wholesale_price: data.wholesale_price,
            track_inventory: data.track_inventory,
            unit_of_measure_id: data.unit_of_measure_id,
            reorder_level: data.reorder_level,
            reorder_quantity: data.reorder_quantity,
            tax_preference: data.tax_preference,
            tax_rate: data.tax_rate,
            hsn_sac_code: data.hsn_sac_code,
            weight: data.weight,
            weight_unit: data.weight_unit,
            length: data.length,
            width: data.width,
            height: data.height,
            dimension_unit: data.dimension_unit,
            primary_image_url: data.primary_image_url,
            additional_images: data.additional_images,
            preferred_vendor_id: data.preferred_vendor_id,
            tags: data.tags,
            notes: data.notes,
            status: data.status,
        };

        const productId = await this.db.insert('products', productData);

        // Initialize inventory stock if tracking inventory
        if (data.track_inventory) {
            // Assuming branch_id = 1 for main branch (should get from settings)
            const branchId = 1;
            await this.db.insert('inventory_stock', {
                product_id: productId,
                branch_id: branchId,
                quantity_on_hand: 0,
                quantity_reserved: 0,
                quantity_available: 0,
                average_cost: data.cost_price,
                last_cost: data.cost_price,
                reorder_level: data.reorder_level,
            });
        }

        return productId;
    }

    async updateProduct(id: number, data: Partial<ProductFormData>): Promise<boolean> {
        return await this.db.update('products', id, {
            ...data,
            updated_at: new Date().toISOString(),
        });
    }

    async getProductById(id: number): Promise<Product | null> {
        return await this.db.findById<Product>('products', id);
    }

    async getProducts(options?: QueryOptions): Promise<Product[]> {
        let products = await this.db.findAll<Product>('products', {
            limit: options?.limit,
            offset: options?.offset,
        });

        // Apply client-side filters
        if (options?.search) {
            const search = options.search.toLowerCase();
            products = products.filter(
                (p) =>
                    p.name?.toLowerCase().includes(search) ||
                    p.product_code?.toLowerCase().includes(search) ||
                    p.barcode?.includes(search) ||
                    p.sku?.toLowerCase().includes(search)
            );
        }

        if (options?.category_id) {
            products = products.filter((p) => p.category_id === options.category_id);
        }

        if (options?.brand_id) {
            products = products.filter((p) => p.brand_id === options.brand_id);
        }

        if (options?.product_type) {
            products = products.filter((p) => p.product_type === options.product_type);
        }

        if (options?.status) {
            products = products.filter((p) => p.status === options.status);
        }

        if (options?.stock_status) {
            const stock = await this.db.findAll<InventoryStock>('inventory_stock');
            products = products.filter((p) => {
                if (!p.track_inventory) return false;
                const stockData = stock.find((s) => s.product_id === p.id);
                if (!stockData) return options.stock_status === 'out_of_stock';

                if (options.stock_status === 'out_of_stock') {
                    return stockData.quantity_available === 0;
                } else if (options.stock_status === 'low_stock') {
                    return (
                        p.reorder_level !== undefined &&
                        stockData.quantity_available <= p.reorder_level &&
                        stockData.quantity_available > 0
                    );
                } else {
                    return (
                        stockData.quantity_available > 0 &&
                        (p.reorder_level === undefined ||
                            stockData.quantity_available > p.reorder_level)
                    );
                }
            });
        }

        return products;
    }

    async deleteProduct(id: number): Promise<boolean> {
        // Check if product is used in any transactions
        const invoices = await this.db.findAll('sales_invoice_items');
        const orders = await this.db.findAll('sales_order_items');
        const pos = await this.db.findAll('purchase_order_items');

        const isUsed =
            invoices.some((item: any) => item.product_id === id) ||
            orders.some((item: any) => item.product_id === id) ||
            pos.some((item: any) => item.product_id === id);

        if (isUsed) {
            throw new Error('Cannot delete product that is used in transactions');
        }

        return await this.db.delete('products', id);
    }

    async searchProducts(query: string): Promise<Product[]> {
        const all = await this.db.findAll<Product>('products');
        const q = query.toLowerCase();
        return all.filter(
            (p) =>
                p.name?.toLowerCase().includes(q) ||
                p.product_code?.toLowerCase().includes(q) ||
                p.barcode?.includes(q) ||
                p.sku?.toLowerCase().includes(q)
        );
    }

    async getProductStock(productId: number, branchId: number = 1): Promise<InventoryStock | null> {
        const allStock = await this.db.findAll<InventoryStock>('inventory_stock');
        return (
            allStock.find((s) => s.product_id === productId && s.branch_id === branchId) || null
        );
    }

    async updateProductPrice(productId: number, prices: {
        cost_price?: number;
        selling_price?: number;
        mrp?: number;
        wholesale_price?: number;
    }): Promise<boolean> {
        return await this.db.update('products', productId, prices);
    }

    // Categories
    async getCategories(): Promise<ProductCategory[]> {
        return await this.db.findAll<ProductCategory>('product_categories');
    }

    async createCategory(data: Omit<ProductCategory, 'id' | 'created_at'>): Promise<number> {
        return await this.db.insert('product_categories', data);
    }

    async updateCategory(id: number, data: Partial<ProductCategory>): Promise<boolean> {
        return await this.db.update('product_categories', id, data);
    }

    async deleteCategory(id: number): Promise<boolean> {
        // Check if category has products
        const products = await this.db.findAll<Product>('products');
        const hasProducts = products.some((p) => p.category_id === id);
        if (hasProducts) {
            throw new Error('Cannot delete category that has products');
        }
        return await this.db.delete('product_categories', id);
    }

    // Brands
    async getBrands(): Promise<ProductBrand[]> {
        return await this.db.findAll<ProductBrand>('product_brands');
    }

    async createBrand(data: Omit<ProductBrand, 'id' | 'created_at'>): Promise<number> {
        return await this.db.insert('product_brands', data);
    }

    async updateBrand(id: number, data: Partial<ProductBrand>): Promise<boolean> {
        return await this.db.update('product_brands', id, data);
    }

    async deleteBrand(id: number): Promise<boolean> {
        // Check if brand has products
        const products = await this.db.findAll<Product>('products');
        const hasProducts = products.some((p) => p.brand_id === id);
        if (hasProducts) {
            throw new Error('Cannot delete brand that has products');
        }
        return await this.db.delete('product_brands', id);
    }

    // Units of Measure
    async getUnitsOfMeasure(): Promise<UnitOfMeasure[]> {
        return await this.db.findAll<UnitOfMeasure>('units_of_measure');
    }
}

export default new ProductService();

