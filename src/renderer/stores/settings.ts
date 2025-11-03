import { create } from 'zustand';

type ThemeMode = 'light' | 'dark';

type SettingsState = {
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
};

export const useSettingsStore = create<SettingsState>((set) => ({
  theme: 'light',
  setTheme: (t) => set({ theme: t }),
}));
