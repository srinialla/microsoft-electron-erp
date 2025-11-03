import { app, BrowserWindow, dialog, ipcMain, nativeImage, Notification, shell } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import log from 'electron-log';
import windowStateKeeper from 'electron-window-state';
import { autoUpdater } from 'electron-updater';
import Database from 'better-sqlite3';
import keytar from 'keytar';
import { type DatabaseRequest, type DatabaseResponse, type FilesystemRequest, type FilesystemResponse, type NotificationRequest, type UpdateEvents } from '@shared/ipc';

// Logging setup
Object.assign(console, log.functions);
log.initialize();
log.transports.file.level = 'info';

const isDev = !app.isPackaged || !!process.env.VITE_DEV_SERVER_URL;

// Ensure single instance to avoid multiple windows during dev restarts
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
}
app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

let mainWindow: BrowserWindow | null = null;
let db: Database.Database | null = null;

function createDatabase(): void {
  const userData = app.getPath('userData');
  const dbPath = path.join(userData, 'app.db');
  fs.mkdirSync(userData, { recursive: true });
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  // Initial schema
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      metadata TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `);
}

function createWindow(): void {
  const mainWindowState = windowStateKeeper({ defaultWidth: 1280, defaultHeight: 800 });

  const iconPath = path.join(__dirname, '../../resources/icon.png');
  const icon = fs.existsSync(iconPath) ? nativeImage.createFromPath(iconPath) : undefined;

  mainWindow = new BrowserWindow({
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    minWidth: 1024,
    minHeight: 700,
    frame: false, // custom title bar
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    icon,
    show: false,
    backgroundColor: '#ffffff',
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindowState.manage(mainWindow);

  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
    const url = process.env.VITE_DEV_SERVER_URL ?? 'http://localhost:5173';
    mainWindow.loadURL(url);
  } else {
    const indexHtml = path.join(__dirname, '../renderer/index.html');
    if (fs.existsSync(indexHtml)) {
      mainWindow.loadFile(indexHtml);
    } else {
      const fallback = process.env.VITE_DEV_SERVER_URL ?? 'http://localhost:5173';
      log.warn('Renderer file not found at', indexHtml, 'Falling back to dev server at', fallback);
      mainWindow.loadURL(fallback).catch((err) => {
        dialog.showErrorBox('Failed to load UI', `Tried: ${indexHtml}\nFallback: ${fallback}\n${String(err)}`);
      });
    }
  }
}

function setupMenu(): void {
  // Minimal menu: users can add more entries later
  const { Menu } = require('electron');
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        { role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'Learn More',
          click: () => shell.openExternal('https://www.electronjs.org'),
        },
      ],
    },
  ];
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function setupIpc(): void {
  ipcMain.handle('db:request', (_evt, req: DatabaseRequest): DatabaseResponse => {
    try {
      if (!db) throw new Error('DB not initialized');
      if (req.type === 'query') {
        const stmt = db.prepare(req.sql);
        const rows = stmt.all(...(req.params ?? []));
        return { ok: true, rows };
      }
      if (req.type === 'run') {
        const stmt = db.prepare(req.sql);
        const info = stmt.run(...(req.params ?? []));
        return { ok: true, changes: info.changes, lastInsertRowid: Number(info.lastInsertRowid) };
      }
      return { ok: false, error: 'Unknown request' };
    } catch (e: any) {
      log.error('DB error', e);
      return { ok: false, error: String(e.message ?? e) };
    }
  });

  ipcMain.handle('fs:request', async (_evt, req: FilesystemRequest): Promise<FilesystemResponse> => {
    try {
      if (req.type === 'readFile') {
        const data = fs.readFileSync(req.path, req.encoding ?? 'utf-8');
        return { ok: true, data };
      }
      if (req.type === 'writeFile') {
        fs.writeFileSync(req.path, req.data, req.encoding);
        return { ok: true };
      }
      if (req.type === 'selectDirectory') {
        const res = await dialog.showOpenDialog({ properties: ['openDirectory', 'createDirectory'] });
        if (res.canceled || res.filePaths.length === 0) return { ok: true, path: undefined } as any;
        return { ok: true, path: res.filePaths[0] };
      }
      return { ok: false, error: 'Unknown request' };
    } catch (e: any) {
      return { ok: false, error: String(e.message ?? e) };
    }
  });

  ipcMain.on('notify:show', (_evt, req: NotificationRequest) => {
    new Notification({ title: req.title, body: req.body }).show();
  });

  // Notification management
  ipcMain.handle('notifications:get', () => {
    // Return sample notifications for now
    return [
      {
        id: '1',
        title: 'New customer added',
        message: 'John Doe has been added to the system',
        timestamp: '2 minutes ago',
        unread: true,
      },
      {
        id: '2',
        title: 'Inventory low',
        message: 'Product "Widget A" is running low on stock',
        timestamp: '1 hour ago',
        unread: true,
      },
      {
        id: '3',
        title: 'Backup completed',
        message: 'Daily backup completed successfully',
        timestamp: '3 hours ago',
        unread: false,
      },
    ];
  });

  ipcMain.handle('notifications:markAsRead', (_evt, notificationId: string) => {
    // In a real app, this would update the database
    console.log('Marking notification as read:', notificationId);
    return true;
  });

  ipcMain.handle('notifications:markAllAsRead', () => {
    // In a real app, this would update the database
    console.log('Marking all notifications as read');
    return true;
  });

  // Auto-update relays
  autoUpdater.on('checking-for-update', () => sendUpdateEvent({ event: 'checking-for-update' }));
  autoUpdater.on('update-available', (info) => sendUpdateEvent({ event: 'update-available', info: { version: info.version } }));
  autoUpdater.on('update-not-available', () => sendUpdateEvent({ event: 'update-not-available' }));
  autoUpdater.on('error', (err) => sendUpdateEvent({ event: 'error', message: String(err) }));
  autoUpdater.on('download-progress', (progress) =>
    sendUpdateEvent({ event: 'download-progress', progress: { percent: progress.percent, bytesPerSecond: progress.bytesPerSecond } }),
  );
  autoUpdater.on('update-downloaded', (info) => sendUpdateEvent({ event: 'update-downloaded', info: { version: info.version } }));

  ipcMain.handle('updates:check', async () => {
    try {
      await autoUpdater.checkForUpdates();
    } catch (e) {
      log.error('Update check failed', e);
    }
  });

  ipcMain.handle('updates:quit-and-install', async () => {
    autoUpdater.quitAndInstall();
  });

  ipcMain.handle('app:getVersion', async () => app.getVersion());

  // Window controls
  ipcMain.handle('window:minimize', () => {
    mainWindow?.minimize();
  });
  ipcMain.handle('window:maximizeOrRestore', () => {
    if (!mainWindow) return;
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });
  ipcMain.handle('window:toggleFullScreen', () => {
    if (!mainWindow) return;
    const next = !mainWindow.isFullScreen();
    mainWindow.setFullScreen(next);
  });
  ipcMain.handle('window:close', () => {
    mainWindow?.close();
  });
  ipcMain.handle('window:isMaximized', () => {
    return !!mainWindow?.isMaximized();
  });
  ipcMain.handle('window:isFullScreen', () => {
    return !!mainWindow?.isFullScreen();
  });

  // Secure token storage via keytar
  ipcMain.handle('auth:save', async (_evt, token: string | null) => {
    const service = app.getName();
    const account = 'current-user';
    if (!token) {
      await keytar.deletePassword(service, account);
      return;
    }
    await keytar.setPassword(service, account, token);
  });
  ipcMain.handle('auth:load', async () => {
    const service = app.getName();
    const account = 'current-user';
    return (await keytar.getPassword(service, account)) ?? null;
  });
  ipcMain.handle('auth:clear', async () => {
    const service = app.getName();
    const account = 'current-user';
    await keytar.deletePassword(service, account);
  });
}

function sendUpdateEvent(evt: UpdateEvents): void {
  mainWindow?.webContents.send('updates:event', evt);
}

function setupAutoUpdate(): void {
  // Optional channel
  const channel = process.env.UPDATE_CHANNEL ?? 'latest';
  autoUpdater.channel = channel;
  autoUpdater.autoDownload = true;
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.whenReady().then(() => {
  createDatabase();
  setupMenu();
  setupIpc();
  setupAutoUpdate();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  if (!isDev) {
    autoUpdater.checkForUpdatesAndNotify().catch((e) => log.error('Auto update error', e));
  }
});
