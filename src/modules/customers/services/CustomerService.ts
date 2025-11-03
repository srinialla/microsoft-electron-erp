import type { DatabaseService } from '../../../services/database/interface/DatabaseService';
import { getDatabaseService } from '../../../services/database/DatabaseFactory';
import type { Customer, CustomerCategory, CustomerContact, CustomerShippingAddress } from '../../../shared/types/entities';
import { generateCustomerCode } from '../../../shared/utils/numberGenerator';

export interface CustomerFormData {
  customer_type: 'individual' | 'company';
  title?: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  display_name: string;
  email?: string;
  phone?: string;
  mobile?: string;
  website?: string;
  contact_person?: string;
  contact_person_email?: string;
  contact_person_phone?: string;
  billing_address_line1?: string;
  billing_address_line2?: string;
  billing_city?: string;
  billing_state?: string;
  billing_country?: string;
  billing_postal_code?: string;
  shipping_address_line1?: string;
  shipping_address_line2?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_country?: string;
  shipping_postal_code?: string;
  tax_number?: string;
  pan_number?: string;
  gst_number?: string;
  customer_category_id?: number;
  price_list_id?: number;
  payment_terms?: number;
  credit_limit?: number;
  discount_percent?: number;
  opening_balance?: number;
  notes?: string;
  tags?: string;
  status: 'active' | 'inactive';
}

export interface QueryOptions {
  search?: string;
  category_id?: number;
  status?: 'active' | 'inactive';
  customer_type?: 'individual' | 'company';
  limit?: number;
  offset?: number;
}

class CustomerService {
  private db: DatabaseService;

  constructor() {
    this.db = getDatabaseService();
  }

  async createCustomer(data: CustomerFormData): Promise<number> {
    const customerCode = await generateCustomerCode(this.db);
    
    const customerData: Omit<Customer, 'id' | 'created_at' | 'updated_at'> = {
      customer_code: customerCode,
      customer_type: data.customer_type,
      title: data.title,
      first_name: data.first_name,
      last_name: data.last_name,
      company_name: data.company_name,
      display_name: data.display_name,
      email: data.email,
      phone: data.phone,
      mobile: data.mobile,
      website: data.website,
      contact_person: data.contact_person,
      contact_person_email: data.contact_person_email,
      contact_person_phone: data.contact_person_phone,
      billing_address_line1: data.billing_address_line1,
      billing_address_line2: data.billing_address_line2,
      billing_city: data.billing_city,
      billing_state: data.billing_state,
      billing_country: data.billing_country,
      billing_postal_code: data.billing_postal_code,
      shipping_address_line1: data.shipping_address_line1,
      shipping_address_line2: data.shipping_address_line2,
      shipping_city: data.shipping_city,
      shipping_state: data.shipping_state,
      shipping_country: data.shipping_country,
      shipping_postal_code: data.shipping_postal_code,
      tax_number: data.tax_number,
      pan_number: data.pan_number,
      gst_number: data.gst_number,
      customer_category_id: data.customer_category_id,
      price_list_id: data.price_list_id,
      payment_terms: data.payment_terms,
      credit_limit: data.credit_limit,
      discount_percent: data.discount_percent,
      opening_balance: data.opening_balance || 0,
      current_balance: data.opening_balance || 0,
      notes: data.notes,
      tags: data.tags,
      status: data.status,
    };

    return await this.db.insert('customers', customerData);
  }

  async updateCustomer(id: number, data: Partial<CustomerFormData>): Promise<boolean> {
    return await this.db.update('customers', id, {
      ...data,
      updated_at: new Date().toISOString(),
    });
  }

  async getCustomerById(id: number): Promise<Customer | null> {
    return await this.db.findById<Customer>('customers', id);
  }

  async getCustomers(options?: QueryOptions): Promise<Customer[]> {
    // Note: IndexedDB doesn't support complex queries, so we'll filter after fetching
    // In production, use SQL-like queries for SQLite

    let customers = await this.db.findAll<Customer>('customers', {
      limit: options?.limit,
      offset: options?.offset,
    });

    // Apply client-side filters
    if (options?.search) {
      const search = options.search.toLowerCase();
      customers = customers.filter(
        (c) =>
          c.display_name?.toLowerCase().includes(search) ||
          c.email?.toLowerCase().includes(search) ||
          c.phone?.includes(search) ||
          c.customer_code?.toLowerCase().includes(search)
      );
    }

    if (options?.category_id) {
      customers = customers.filter((c) => c.customer_category_id === options.category_id);
    }

    if (options?.status) {
      customers = customers.filter((c) => c.status === options.status);
    }

    if (options?.customer_type) {
      customers = customers.filter((c) => c.customer_type === options.customer_type);
    }

    return customers;
  }

  async deleteCustomer(id: number): Promise<boolean> {
    return await this.db.delete('customers', id);
  }

  async searchCustomers(query: string): Promise<Customer[]> {
    const all = await this.db.findAll<Customer>('customers');
    const q = query.toLowerCase();
    return all.filter(
      (c) =>
        c.display_name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.includes(q) ||
        c.customer_code?.toLowerCase().includes(q)
    );
  }

  async getCustomerBalance(id: number): Promise<number> {
    const customer = await this.getCustomerById(id);
    return customer?.current_balance || 0;
  }

  async getCustomerTransactions(customerId: number): Promise<any[]> {
    // Get invoices and payments for customer
    // Note: IndexedDB doesn't support WHERE clauses directly, so filter client-side
    const allInvoices = await this.db.findAll('sales_invoices');
    const allPayments = await this.db.findAll('payments');
    
    const invoices = allInvoices.filter((inv: any) => inv.customer_id === customerId);
    const payments = allPayments.filter((pay: any) => pay.customer_id === customerId);

    return [...invoices, ...payments].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  // Customer Categories
  async getCategories(): Promise<CustomerCategory[]> {
    return await this.db.findAll<CustomerCategory>('customer_categories');
  }

  async createCategory(data: Omit<CustomerCategory, 'id' | 'created_at'>): Promise<number> {
    return await this.db.insert('customer_categories', data);
  }

  async updateCategory(id: number, data: Partial<CustomerCategory>): Promise<boolean> {
    return await this.db.update('customer_categories', id, data);
  }

  async deleteCategory(id: number): Promise<boolean> {
    return await this.db.delete('customer_categories', id);
  }

  // Customer Contacts
  async getCustomerContacts(customerId: number): Promise<CustomerContact[]> {
    const all = await this.db.findAll<CustomerContact>('customer_contacts');
    return all.filter((c) => c.customer_id === customerId);
  }

  async addContact(data: Omit<CustomerContact, 'id' | 'created_at'>): Promise<number> {
    return await this.db.insert('customer_contacts', data);
  }

  async updateContact(id: number, data: Partial<CustomerContact>): Promise<boolean> {
    return await this.db.update('customer_contacts', id, data);
  }

  async deleteContact(id: number): Promise<boolean> {
    return await this.db.delete('customer_contacts', id);
  }

  // Shipping Addresses
  async getShippingAddresses(customerId: number): Promise<CustomerShippingAddress[]> {
    const all = await this.db.findAll<CustomerShippingAddress>('customer_shipping_addresses');
    return all.filter((a) => a.customer_id === customerId);
  }

  async addShippingAddress(data: Omit<CustomerShippingAddress, 'id' | 'created_at'>): Promise<number> {
    return await this.db.insert('customer_shipping_addresses', data);
  }

  async updateShippingAddress(id: number, data: Partial<CustomerShippingAddress>): Promise<boolean> {
    return await this.db.update('customer_shipping_addresses', id, data);
  }

  async deleteShippingAddress(id: number): Promise<boolean> {
    return await this.db.delete('customer_shipping_addresses', id);
  }
}

export default new CustomerService();

