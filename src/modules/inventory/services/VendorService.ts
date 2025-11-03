import type { DatabaseService } from '../../../services/database/interface/DatabaseService';
import { getDatabaseService } from '../../../services/database/DatabaseFactory';
import type { Vendor } from '../../../shared/types/entities';
import { generateVendorCode } from '../../../shared/utils/numberGenerator';

export interface VendorFormData {
    vendor_type: 'individual' | 'company';
    name: string;
    display_name: string;
    email?: string;
    phone?: string;
    website?: string;
    contact_person?: string;
    billing_address_line1?: string;
    billing_address_line2?: string;
    billing_city?: string;
    billing_state?: string;
    billing_country?: string;
    billing_postal_code?: string;
    tax_number?: string;
    gst_number?: string;
    payment_terms?: number;
    bank_name?: string;
    bank_account_number?: string;
    bank_ifsc?: string;
    preferred_payment_method?: string;
    rating?: number;
    notes?: string;
    status: 'active' | 'inactive';
}

export interface QueryOptions {
    search?: string;
    status?: 'active' | 'inactive';
    vendor_type?: 'individual' | 'company';
    limit?: number;
    offset?: number;
}

class VendorService {
    private db: DatabaseService;

    constructor() {
        this.db = getDatabaseService();
    }

    async createVendor(data: VendorFormData): Promise<number> {
        const vendorCode = await generateVendorCode(this.db);

        const vendorData: Omit<Vendor, 'id' | 'created_at' | 'updated_at'> = {
            vendor_code: vendorCode,
            vendor_type: data.vendor_type,
            name: data.name,
            display_name: data.display_name,
            email: data.email,
            phone: data.phone,
            website: data.website,
            contact_person: data.contact_person,
            billing_address_line1: data.billing_address_line1,
            billing_address_line2: data.billing_address_line2,
            billing_city: data.billing_city,
            billing_state: data.billing_state,
            billing_country: data.billing_country,
            billing_postal_code: data.billing_postal_code,
            tax_number: data.tax_number,
            gst_number: data.gst_number,
            payment_terms: data.payment_terms,
            bank_name: data.bank_name,
            bank_account_number: data.bank_account_number,
            bank_ifsc: data.bank_ifsc,
            preferred_payment_method: data.preferred_payment_method,
            rating: data.rating,
            notes: data.notes,
            status: data.status,
        };

        return await this.db.insert('vendors', vendorData);
    }

    async updateVendor(id: number, data: Partial<VendorFormData>): Promise<boolean> {
        return await this.db.update('vendors', id, {
            ...data,
            updated_at: new Date().toISOString(),
        });
    }

    async getVendorById(id: number): Promise<Vendor | null> {
        return await this.db.findById<Vendor>('vendors', id);
    }

    async getVendors(options?: QueryOptions): Promise<Vendor[]> {
        let vendors = await this.db.findAll<Vendor>('vendors', {
            limit: options?.limit,
            offset: options?.offset,
        });

        if (options?.search) {
            const search = options.search.toLowerCase();
            vendors = vendors.filter(
                (v) =>
                    v.display_name?.toLowerCase().includes(search) ||
                    v.email?.toLowerCase().includes(search) ||
                    v.phone?.includes(search) ||
                    v.vendor_code?.toLowerCase().includes(search)
            );
        }

        if (options?.status) {
            vendors = vendors.filter((v) => v.status === options.status);
        }

        if (options?.vendor_type) {
            vendors = vendors.filter((v) => v.vendor_type === options.vendor_type);
        }

        return vendors;
    }

    async deleteVendor(id: number): Promise<boolean> {
        // Check if vendor is used in purchase orders
        const pos = await this.db.findAll('purchase_orders');
        const isUsed = pos.some((po: any) => po.vendor_id === id);
        if (isUsed) {
            throw new Error('Cannot delete vendor that has purchase orders');
        }
        return await this.db.delete('vendors', id);
    }

    async searchVendors(query: string): Promise<Vendor[]> {
        const all = await this.db.findAll<Vendor>('vendors');
        const q = query.toLowerCase();
        return all.filter(
            (v) =>
                v.display_name?.toLowerCase().includes(q) ||
                v.email?.toLowerCase().includes(q) ||
                v.phone?.includes(q) ||
                v.vendor_code?.toLowerCase().includes(q)
        );
    }
}

export default new VendorService();

