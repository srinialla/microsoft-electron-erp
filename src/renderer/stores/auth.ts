import { create } from 'zustand';

// Session duration: 6 hours in milliseconds
const SESSION_DURATION = 6 * 60 * 60 * 1000; // 6 hours

type AuthState = {
  isAuthenticated: boolean;
  username: string | null;
  isInitializing: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  init: () => Promise<void>;
};

// Valid credentials
const VALID_USERNAME = 'admin';
const VALID_PASSWORD = '1234';

// Wait for window.api to be available
const waitForApi = (maxRetries = 10, delay = 100): Promise<void> => {
  return new Promise((resolve, reject) => {
    let retries = 0;
    const checkApi = () => {
      if (typeof window !== 'undefined' && window.api && window.api.authToken) {
        resolve();
      } else if (retries < maxRetries) {
        retries++;
        setTimeout(checkApi, delay);
      } else {
        reject(new Error('API not available'));
      }
    };
    checkApi();
  });
};

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  username: null,
  isInitializing: true,
  login: async (username: string, password: string) => {
    // Validate credentials
    if (username !== VALID_USERNAME || password !== VALID_PASSWORD) {
      throw new Error('Invalid username or password');
    }

    // Set authenticated state
    set({ isAuthenticated: true, username: VALID_USERNAME });

    // Always persist session for 6 hours
    const expiresAt = Date.now() + SESSION_DURATION;
    await window.api.authToken.save({ token: 'authenticated', expiresAt });
  },
  logout: async () => {
    set({ isAuthenticated: false, username: null });
    await window.api.authToken.clear();
  },
  init: async () => {
    set({ isInitializing: true });
    try {
      // Wait for API to be available
      await waitForApi();

      // Restore session from storage
      const token = await window.api.authToken.load();

      if (token && token.expiresAt > Date.now()) {
        // Session is valid
        set({ isAuthenticated: true, username: VALID_USERNAME, isInitializing: false });
      } else {
        // Session expired or doesn't exist
        if (token) {
          // Clear expired token
          await window.api.authToken.clear();
        }
        set({ isAuthenticated: false, username: null, isInitializing: false });
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      set({ isAuthenticated: false, username: null, isInitializing: false });
    }
  },
}));
