// Shared, strictly-typed IPC channel contracts
export type DatabaseRequest =
  | { type: 'query'; sql: string; params?: unknown[] }
  | { type: 'run'; sql: string; params?: unknown[] };

export type DatabaseResponse =
  | { ok: true; rows: unknown[] }
  | { ok: true; changes: number; lastInsertRowid?: number }
  | { ok: false; error: string };

export type FilesystemRequest =
  | { type: 'readFile'; path: string; encoding?: BufferEncoding }
  | { type: 'writeFile'; path: string; data: string | Buffer; encoding?: BufferEncoding }
  | { type: 'selectDirectory' };

export type FilesystemResponse =
  | { ok: true; data?: string | null; path?: string }
  | { ok: false; error: string };

export type UpdateEvents =
  | { event: 'checking-for-update' }
  | { event: 'update-available'; info: { version: string } }
  | { event: 'update-not-available' }
  | { event: 'error'; message: string }
  | { event: 'download-progress'; progress: { percent: number; bytesPerSecond: number } }
  | { event: 'update-downloaded'; info: { version: string } };

export type NotificationRequest = { title: string; body: string };

export type Notification = {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  unread: boolean;
  icon?: string;
};

export type AuthToken = { token: string; expiresAt: number } | null;

export interface PreloadApi {
  // Database
  dbQuery: (request: DatabaseRequest) => Promise<DatabaseResponse>;
  // File system helpers
  fs: (request: FilesystemRequest) => Promise<FilesystemResponse>;
  // Auto-update controls
  updates: {
    check: () => Promise<void>;
    on: (callback: (evt: UpdateEvents) => void) => () => void; // returns unsubscribe
    quitAndInstall: () => Promise<void>;
  };
  // Notifications
  notify: (req: NotificationRequest) => void;
  notifications: {
    get: () => Promise<Notification[]>;
    markAsRead: (id: string) => Promise<boolean>;
    markAllAsRead: () => Promise<boolean>;
  };
  // App info
  app: {
    getVersion: () => Promise<string>;
    platform: NodeJS.Platform;
  };
  // Window controls
  window: {
    minimize: () => Promise<void>;
    maximizeOrRestore: () => Promise<void>;
    close: () => Promise<void>;
    isMaximized: () => Promise<boolean>;
  };
  // Secure token storage
  authToken: {
    save: (token: AuthToken) => Promise<void>;
    load: () => Promise<AuthToken>;
    clear: () => Promise<void>;
  };
}

declare global {
  // Expose in window
  interface Window {
    api: PreloadApi;
  }
}
