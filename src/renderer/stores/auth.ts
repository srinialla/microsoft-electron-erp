import { create } from 'zustand';

type AuthState = {
  isAuthenticated: boolean;
  username: string | null;
  login: (username: string, remember: boolean) => Promise<void> | void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  username: null,
  login: async (username: string, remember: boolean) => {
    set({ isAuthenticated: true, username });
    if (remember) await window.api.authToken.save({ token: 'demo', expiresAt: Date.now() + 7 * 86400000 });
  },
  logout: () => set({ isAuthenticated: false, username: null }),
}));
