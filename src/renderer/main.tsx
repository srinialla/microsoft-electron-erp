import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { FluentProvider, webLightTheme, webDarkTheme } from '@fluentui/react-components';
import { useSettingsStore } from './stores/settings';
import { useCurrencyStore } from './stores/currency';
import { setGlobalCurrency } from '../shared/utils/formatting';
import { router } from './routes/router';
import './styles.css';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider } from './components/ToastProvider';
import { UpdateDialog } from './components/UpdateDialog';
import { initDatabase } from '../services/database/initDatabase';
import { useAuthStore } from './stores/auth';

// Platform detection and API setup
import type { PreloadApi, AuthToken, Notification } from '@shared/ipc';

declare global {
  interface Window {
    Capacitor?: any;
  }
}

// Initialize platform-specific API
if (typeof window !== 'undefined' && !window.api) {
  // Check if Capacitor is available (mobile)
  const isCapacitor = (window as any).Capacitor !== undefined;

  if (isCapacitor) {
    // Mobile - use Capacitor APIs
    import('./utils/mobileApi').then(({ mobileApi }) => {
      window.api = mobileApi;
      document.body.classList.add('platform-mobile');
      document.body.classList.add(`platform-${mobileApi.app.platform}`);
    });
  } else {
    // Check if Electron API is available (desktop)
    const isElectron = typeof (window as any).electron !== 'undefined';

    if (isElectron) {
      // Electron desktop - API is provided by preload script
      // Wait a bit for preload to initialize
      setTimeout(() => {
        if (window.api) {
          document.body.classList.add('platform-desktop');
          document.body.classList.add(`platform-${window.api.app.platform}`);
        }
      }, 100);
    } else {
      // Web - provide web shim
      const AUTH_KEY = 'authToken';
      const webApi: PreloadApi = {
        dbQuery: async () => ({ ok: false, error: 'Database not available in web mode' }),
        fs: async () => ({ ok: false, error: 'File system not available in web mode' }),
        updates: {
          check: async () => {},
          on: () => () => {},
          quitAndInstall: async () => {},
        },
        notify: () => {},
        notifications: {
          get: async (): Promise<Notification[]> => [],
          markAsRead: async () => true,
          markAllAsRead: async () => true,
        },
        app: {
          platform: process.platform || 'linux',
          getVersion: async () => 'web-dev',
        },
        window: {
          minimize: async () => {},
          maximizeOrRestore: async () => {},
          close: async () => {},
          isMaximized: async () => false,
        },
        authToken: {
          save: async (token: AuthToken) => {
            localStorage.setItem(AUTH_KEY, JSON.stringify(token));
          },
          load: async (): Promise<AuthToken> => {
            const raw = localStorage.getItem(AUTH_KEY);
            return raw ? JSON.parse(raw) : null;
          },
          clear: async () => {
            localStorage.removeItem(AUTH_KEY);
          },
        },
      };
      window.api = webApi;
      document.body.classList.add('platform-web');
    }
  }
}

function AppRoot() {
  const theme = useSettingsStore((s) => s.theme);
  const currency = useCurrencyStore((s) => s.currency);
  const loadCurrency = useCurrencyStore((s) => s.loadCurrency);
  const initAuth = useAuthStore((s) => s.init);
  const [dbReady, setDbReady] = React.useState(false);
  const [authReady, setAuthReady] = React.useState(false);

  // Initialize authentication session restoration
  React.useEffect(() => {
    initAuth()
      .then(() => {
        setAuthReady(true);
        console.log('Authentication initialized');
      })
      .catch((error: unknown) => {
        console.error('Failed to initialize auth:', error);
        setAuthReady(true);
      });
  }, [initAuth]);

  React.useEffect(() => {
    initDatabase()
      .then(async () => {
        setDbReady(true);
        console.log('Database ready');
        // Load currency from company settings
        await loadCurrency();
      })
      .catch((error: unknown) => {
        console.error('Failed to initialize database:', error);
        // Still show the app, but database operations will fail
        setDbReady(true);
      });
  }, []);

  // Update global currency whenever it changes
  React.useEffect(() => {
    if (currency) {
      setGlobalCurrency(currency);
    }
  }, [currency]);

  if (!dbReady || !authReady) {
    return (
      <FluentProvider
        theme={theme === 'dark' ? webDarkTheme : webLightTheme}
        style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <div>Initializing...</div>
      </FluentProvider>
    );
  }

  return (
    <FluentProvider
      theme={theme === 'dark' ? webDarkTheme : webLightTheme}
      style={{ height: '100vh' }}
    >
      <ErrorBoundary>
        <ToastProvider>
          <RouterProvider router={router} />
          <UpdateDialog />
        </ToastProvider>
      </ErrorBoundary>
    </FluentProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppRoot />
  </React.StrictMode>,
);
