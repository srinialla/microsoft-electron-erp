import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import SettingsService from '../../modules/settings/services/SettingsService';

type CurrencyState = {
    currency: string;
    setCurrency: (currency: string) => void;
    loadCurrency: () => Promise<void>;
};

export const useCurrencyStore = create<CurrencyState>()(
    persist(
        (set) => ({
            currency: 'INR', // Default to INR
            setCurrency: async (currency: string) => {
                set({ currency });
                // Also update company setting
                try {
                    const company = await SettingsService.getCompany();
                    if (company) {
                        await SettingsService.updateCompany({ currency });
                    }
                } catch (error) {
                    console.error('Failed to update company currency:', error);
                }
            },
            loadCurrency: async () => {
                try {
                    const company = await SettingsService.getCompany();
                    if (company?.currency) {
                        set({ currency: company.currency });
                    }
                } catch (error) {
                    console.error('Failed to load currency:', error);
                }
            },
        }),
        {
            name: 'currency-storage',
        }
    )
);

