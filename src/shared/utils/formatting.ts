/**
 * Extended formatting utilities for ERP
 */

// This will be set from the currency store when available
let globalCurrency: string | null = null;

export const setGlobalCurrency = (currency: string) => {
    globalCurrency = currency;
};

// Export getter for other modules
export const getGlobalCurrency = (): string | null => {
    return globalCurrency;
};

export const formatCurrency = (amount: number, currency?: string): string => {
    // Use provided currency, or fall back to global currency, or default to INR
    const selectedCurrency = currency || globalCurrency || 'INR';
    const locale = selectedCurrency === 'INR' ? 'en-IN' : 'en-US';
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: selectedCurrency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
};

export const formatDate = (date: string | Date, format = 'MM/DD/YYYY'): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';

    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();

    return format
        .replace('MM', month)
        .replace('DD', day)
        .replace('YYYY', String(year))
        .replace('YY', String(year).slice(-2));
};

export const formatDateTime = (date: string | Date): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';

    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    }).format(d);
};

export const formatNumber = (num: number, decimals = 2): string => {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(num);
};

export const formatPercentage = (value: number): string => {
    return `${formatNumber(value, 2)}%`;
};

export const formatPhone = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
};

