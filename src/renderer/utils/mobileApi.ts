import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { LocalNotifications } from '@capacitor/local-notifications';
import { App } from '@capacitor/app';
import type { PreloadApi, DatabaseRequest, DatabaseResponse, FilesystemRequest, FilesystemResponse, NotificationRequest, AuthToken, Notification } from '@shared/ipc';

const AUTH_KEY = 'authToken';
const platform = Capacitor.getPlatform() as NodeJS.Platform;

export const mobileApi: PreloadApi = {
    dbQuery: async (request: DatabaseRequest): Promise<DatabaseResponse> => {
        // Mobile database operations are handled by CapacitorSQLiteService
        // This is a fallback that should not be called in normal flow
        return { ok: false, error: 'Database operations should use DatabaseService directly' };
    },

    fs: async (request: FilesystemRequest): Promise<FilesystemResponse> => {
        try {
            if (Capacitor.getPlatform() === 'web') {
                return { ok: false, error: 'File system not available on web' };
            }

            if (request.type === 'readFile') {
                const file = await Filesystem.readFile({
                    path: request.path,
                    directory: Directory.Data,
                });
                return { ok: true, data: file.data as string };
            }

            if (request.type === 'writeFile') {
                await Filesystem.writeFile({
                    path: request.path,
                    data: request.data as string,
                    directory: Directory.Data,
                });
                return { ok: true };
            }

            if (request.type === 'selectDirectory') {
                // Directory selection not directly available in Capacitor
                return { ok: false, error: 'Directory selection not available on mobile' };
            }

            return { ok: false, error: 'Unknown filesystem request type' };
        } catch (error: any) {
            return { ok: false, error: String(error?.message || error) };
        }
    },

    updates: {
        check: async () => {
            // Auto-updates handled by app stores on mobile
        },
        on: () => {
            // No-op for mobile
            return () => { };
        },
        quitAndInstall: async () => {
            // Not applicable on mobile
        },
    },

    notify: (req: NotificationRequest) => {
        if (Capacitor.getPlatform() !== 'web') {
            LocalNotifications.schedule({
                notifications: [{
                    title: req.title,
                    body: req.body,
                    id: Date.now(),
                }],
            }).catch((error) => {
                console.error('Failed to show notification:', error);
            });
        }
    },

    notifications: {
        get: async (): Promise<Notification[]> => {
            return [];
        },
        markAsRead: async () => true,
        markAllAsRead: async () => true,
    },

    app: {
        platform,
        getVersion: async () => {
            try {
                const info = await App.getInfo();
                return info.version || '1.0.0';
            } catch {
                return '1.0.0';
            }
        },
    },

    window: {
        minimize: async () => {
            // Not available on mobile
        },
        maximizeOrRestore: async () => {
            // Not available on mobile
        },
        close: async () => {
            if (Capacitor.getPlatform() !== 'web') {
                await App.exitApp();
            }
        },
        isMaximized: async () => false,
    },

    authToken: {
        save: async (token: AuthToken) => {
            try {
                if (Capacitor.getPlatform() === 'web') {
                    localStorage.setItem(AUTH_KEY, JSON.stringify(token));
                } else {
                    await Filesystem.writeFile({
                        path: 'auth_token.json',
                        data: JSON.stringify(token),
                        directory: Directory.Data,
                    });
                }
            } catch (error) {
                console.error('Failed to save auth token:', error);
            }
        },
        load: async (): Promise<AuthToken> => {
            try {
                if (Capacitor.getPlatform() === 'web') {
                    const raw = localStorage.getItem(AUTH_KEY);
                    return raw ? JSON.parse(raw) : null;
                } else {
                    const file = await Filesystem.readFile({
                        path: 'auth_token.json',
                        directory: Directory.Data,
                    });
                    return JSON.parse(file.data as string);
                }
            } catch {
                return null;
            }
        },
        clear: async () => {
            try {
                if (Capacitor.getPlatform() === 'web') {
                    localStorage.removeItem(AUTH_KEY);
                } else {
                    await Filesystem.deleteFile({
                        path: 'auth_token.json',
                        directory: Directory.Data,
                    });
                }
            } catch (error) {
                console.error('Failed to clear auth token:', error);
            }
        },
    },
};

