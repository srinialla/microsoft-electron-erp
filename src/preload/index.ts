import { contextBridge, ipcRenderer } from 'electron';
import type { PreloadApi, DatabaseRequest, DatabaseResponse, FilesystemRequest, FilesystemResponse, UpdateEvents, NotificationRequest, AuthToken, Notification } from '@shared/ipc';

const api: PreloadApi = {
  dbQuery: (request: DatabaseRequest) => ipcRenderer.invoke('db:request', request) as Promise<DatabaseResponse>,
  fs: (request: FilesystemRequest) => ipcRenderer.invoke('fs:request', request) as Promise<FilesystemResponse>,
  updates: {
    check: () => ipcRenderer.invoke('updates:check'),
    on: (callback) => {
      const listener = (_: unknown, evt: UpdateEvents) => callback(evt);
      ipcRenderer.on('updates:event', listener);
      return () => ipcRenderer.removeListener('updates:event', listener);
    },
    quitAndInstall: () => ipcRenderer.invoke('updates:quit-and-install'),
  },
  notify: (req: NotificationRequest) => ipcRenderer.send('notify:show', req),
  notifications: {
    get: () => ipcRenderer.invoke('notifications:get') as Promise<Notification[]>,
    markAsRead: (id: string) => ipcRenderer.invoke('notifications:markAsRead', id) as Promise<boolean>,
    markAllAsRead: () => ipcRenderer.invoke('notifications:markAllAsRead') as Promise<boolean>,
  },
  app: {
    getVersion: async () => ipcRenderer.invoke('app:getVersion') as Promise<string>,
    platform: process.platform,
  },
  window: {
    minimize: async () => { await ipcRenderer.invoke('window:minimize'); },
    maximizeOrRestore: async () => { await ipcRenderer.invoke('window:maximizeOrRestore'); },
    toggleFullScreen: async () => { await ipcRenderer.invoke('window:toggleFullScreen'); },
    close: async () => { await ipcRenderer.invoke('window:close'); },
    isMaximized: async () => ipcRenderer.invoke('window:isMaximized') as Promise<boolean>,
    isFullScreen: async () => ipcRenderer.invoke('window:isFullScreen') as Promise<boolean>,
  },
  authToken: {
    save: async (token: AuthToken) => {
      await ipcRenderer.invoke('auth:save', token ? JSON.stringify(token) : null);
    },
    load: async () => {
      const raw = (await ipcRenderer.invoke('auth:load')) as string | null;
      return raw ? (JSON.parse(raw) as AuthToken) : null;
    },
    clear: async () => {
      await ipcRenderer.invoke('auth:clear');
    },
  },
};

contextBridge.exposeInMainWorld('api', api);
