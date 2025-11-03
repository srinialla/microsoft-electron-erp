/**
 * Number generation utilities for ERP documents
 */

import type { DatabaseService } from '../../services/database/interface/DatabaseService';

/**
 * Generate invoice number in format: PREFIX-YYYY-00001
 */
export const generateInvoiceNumber = async (
    prefix: string,
    db: DatabaseService
): Promise<string> => {
    const year = new Date().getFullYear();
    const pattern = `${prefix}-${year}-%`;

    // Query for existing numbers this year
    const existing = await db.query<{ invoice_number: string }>(
        `SELECT invoice_number FROM sales_invoices 
     WHERE invoice_number LIKE ? 
     ORDER BY invoice_number DESC 
     LIMIT 1`,
        [pattern.replace('%', '%')]
    );

    let nextNumber = 1;
    if (existing.length > 0) {
        const lastNumber = existing[0].invoice_number.split('-').pop();
        if (lastNumber) {
            nextNumber = parseInt(lastNumber, 10) + 1;
        }
    }

    return `${prefix}-${year}-${String(nextNumber).padStart(5, '0')}`;
};

/**
 * Generate customer code in format: CUST-00001
 */
export const generateCustomerCode = async (db: DatabaseService): Promise<string> => {
    const existing = await db.query<{ customer_code: string }>(
        `SELECT customer_code FROM customers 
     WHERE customer_code LIKE 'CUST-%' 
     ORDER BY customer_code DESC 
     LIMIT 1`
    );

    let nextNumber = 1;
    if (existing.length > 0) {
        const lastNumber = existing[0].customer_code.split('-').pop();
        if (lastNumber) {
            nextNumber = parseInt(lastNumber, 10) + 1;
        }
    }

    return `CUST-${String(nextNumber).padStart(5, '0')}`;
};

/**
 * Generate vendor code in format: VEN-00001
 */
export const generateVendorCode = async (db: DatabaseService): Promise<string> => {
    const existing = await db.query<{ vendor_code: string }>(
        `SELECT vendor_code FROM vendors 
     WHERE vendor_code LIKE 'VEN-%' 
     ORDER BY vendor_code DESC 
     LIMIT 1`
    );

    let nextNumber = 1;
    if (existing.length > 0) {
        const lastNumber = existing[0].vendor_code.split('-').pop();
        if (lastNumber) {
            nextNumber = parseInt(lastNumber, 10) + 1;
        }
    }

    return `VEN-${String(nextNumber).padStart(5, '0')}`;
};

/**
 * Generate product code in format: PROD-00001
 */
export const generateProductCode = async (db: DatabaseService): Promise<string> => {
    const existing = await db.query<{ product_code: string }>(
        `SELECT product_code FROM products 
     WHERE product_code LIKE 'PROD-%' 
     ORDER BY product_code DESC 
     LIMIT 1`
    );

    let nextNumber = 1;
    if (existing.length > 0) {
        const lastNumber = existing[0].product_code.split('-').pop();
        if (lastNumber) {
            nextNumber = parseInt(lastNumber, 10) + 1;
        }
    }

    return `PROD-${String(nextNumber).padStart(5, '0')}`;
};

/**
 * Generic document number generator
 */
export const generateDocumentNumber = async (
    prefix: string,
    tableName: string,
    numberField: string,
    db: DatabaseService
): Promise<string> => {
    const year = new Date().getFullYear();
    const pattern = `${prefix}-${year}-%`;

    const existing = await db.query<{ [key: string]: string }>(
        `SELECT ${numberField} FROM ${tableName} 
     WHERE ${numberField} LIKE ? 
     ORDER BY ${numberField} DESC 
     LIMIT 1`,
        [pattern.replace('%', '%')]
    );

    let nextNumber = 1;
    if (existing.length > 0) {
        const lastNumber = existing[0][numberField]?.split('-').pop();
        if (lastNumber) {
            nextNumber = parseInt(lastNumber, 10) + 1;
        }
    }

    return `${prefix}-${year}-${String(nextNumber).padStart(5, '0')}`;
};

