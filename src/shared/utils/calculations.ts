/**
 * Calculation utilities for ERP business logic
 */

export interface LineItem {
    quantity: number;
    unitPrice: number;
    discountPercent: number;
    taxRate: number;
}

export interface CalculationResult {
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    lineTotal: number;
}

/**
 * Calculate line item totals
 */
export const calculateLineTotal = (
    quantity: number,
    unitPrice: number,
    discountPercent: number = 0,
    taxRate: number = 0
): CalculationResult => {
    const subtotal = quantity * unitPrice;
    const discountAmount = (subtotal * discountPercent) / 100;
    const subtotalAfterDiscount = subtotal - discountAmount;
    const taxAmount = (subtotalAfterDiscount * taxRate) / 100;
    const lineTotal = subtotalAfterDiscount + taxAmount;

    return {
        subtotal,
        discountAmount,
        taxAmount,
        lineTotal,
    };
};

export interface DocumentTotals {
    subtotal: number;
    totalDiscount: number;
    totalTax: number;
    grandTotal: number;
}

/**
 * Calculate document totals from line items
 */
export const calculateDocumentTotals = (
    items: LineItem[],
    documentDiscountType: 'fixed' | 'percentage' = 'percentage',
    documentDiscountValue: number = 0,
    shippingCharges: number = 0
): DocumentTotals => {
    // Calculate line totals
    const lineTotals = items.map((item) =>
        calculateLineTotal(item.quantity, item.unitPrice, item.discountPercent, item.taxRate)
    );

    // Sum all subtotals
    const subtotal = lineTotals.reduce((sum, line) => sum + line.subtotal, 0);

    // Calculate document-level discount
    let totalDiscount = 0;
    if (documentDiscountType === 'percentage') {
        totalDiscount = (subtotal * documentDiscountValue) / 100;
    } else {
        totalDiscount = documentDiscountValue;
    }

    // Calculate tax on discounted amount
    const subtotalAfterDiscount = subtotal - totalDiscount;
    const totalTax = lineTotals.reduce((sum, line) => sum + line.taxAmount, 0);

    // Add shipping
    const grandTotal = subtotalAfterDiscount + totalTax + shippingCharges;

    return {
        subtotal,
        totalDiscount,
        totalTax,
        grandTotal,
    };
};

/**
 * Calculate stock value
 */
export const calculateStockValue = (quantity: number, averageCost: number): number => {
    return quantity * averageCost;
};

