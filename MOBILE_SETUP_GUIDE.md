# Mobile App Setup Guide - Capacitor

This guide will help you convert your Electron desktop ERP app into a mobile app (APK) using Capacitor.

## Overview

**Capacitor** wraps your web app and provides native mobile APIs. It's the easiest path because:

- ✅ You already have web abstractions (IndexedDB fallback, window.api shims)
- ✅ React components can be reused with minor adjustments
- ✅ Same UI framework (Fluent UI) works on mobile
- ✅ Can build APK directly

## Prerequisites

- Node.js >= 18.17.0
- Android Studio (for APK building)
- Java JDK 11 or later

## Step 1: Install Capacitor

```bash
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android
npm install @capacitor/sqlite  # For database on mobile
npm install @capacitor/filesystem  # For file operations
npm install @capacitor/notifications  # For push notifications
```

## Step 2: Initialize Capacitor

```bash
npx cap init "Fluent ERP" "com.fluenterp.app" --web-dir=dist/renderer
```

This will create `capacitor.config.ts`.

## Step 3: Update Capacitor Config

Edit `capacitor.config.ts`:

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fluenterp.app',
  appName: 'Fluent ERP',
  webDir: 'dist/renderer',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
    },
  },
};

export default config;
```

## Step 4: Create Mobile Database Adapter

Create `src/services/database/capacitor/CapacitorSQLiteService.ts`:

```typescript
import { DatabaseService } from '../interface/DatabaseService';
import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';

export class CapacitorSQLiteService implements DatabaseService {
  private dbName = 'app.db';
  private db: any = null;

  async initialize(): Promise<void> {
    if (Capacitor.getPlatform() === 'web') {
      // Fallback to IndexedDB on web
      return;
    }

    const connection = new SQLiteConnection(CapacitorSQLite);
    const db = await connection.open({
      database: this.dbName,
      encrypted: false,
      mode: 'no-encryption',
      readonly: false,
    });
    this.db = db;

    // Create tables
    await this.db.execute(`
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
      // Add other tables...
    `);
  }

  async findAll<T = any>(table: string, conditions?: Record<string, any>): Promise<T[]> {
    let query = `SELECT * FROM ${table}`;
    const params: any[] = [];

    if (conditions) {
      const where = Object.keys(conditions)
        .map((key, idx) => {
          params.push(conditions[key]);
          return `${key} = ?`;
        })
        .join(' AND ');
      query += ` WHERE ${where}`;
    }

    const result = await this.db.query(query, params);
    return result.values || [];
  }

  async insert<T = any>(table: string, data: Partial<T>): Promise<T> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map(() => '?').join(', ');

    const query = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
    const result = await this.db.run(query, values);

    return { ...data, id: result.changes.lastId } as T;
  }

  async update<T = any>(table: string, id: number, data: Partial<T>): Promise<T> {
    const keys = Object.keys(data);
    const values = [...Object.values(data), id];
    const set = keys.map((key) => `${key} = ?`).join(', ');

    const query = `UPDATE ${table} SET ${set} WHERE id = ?`;
    await this.db.run(query, values);

    const updated = await this.findOne<T>(table, { id });
    return updated!;
  }

  async delete(table: string, id: number): Promise<boolean> {
    const query = `DELETE FROM ${table} WHERE id = ?`;
    await this.db.run(query, [id]);
    return true;
  }

  async findOne<T = any>(table: string, conditions: Record<string, any>): Promise<T | null> {
    const results = await this.findAll<T>(table, conditions);
    return results[0] || null;
  }

  async execute(sql: string, params?: any[]): Promise<any> {
    return await this.db.query(sql, params || []);
  }
}
```

## Step 5: Update Database Factory

Modify `src/services/database/DatabaseFactory.ts`:

```typescript
import { Capacitor } from '@capacitor/core';
import { CapacitorSQLiteService } from './capacitor/CapacitorSQLiteService';
import { SQLiteService } from './sqlite/SQLiteService';
import { IndexedDBService } from './indexeddb/IndexedDBService';

export function getDatabaseService(): DatabaseService {
  if (instance) {
    return instance;
  }

  const platform = Capacitor.getPlatform();

  if (platform === 'android' || platform === 'ios') {
    instance = new CapacitorSQLiteService();
  } else if (platform === 'web') {
    instance = new IndexedDBService();
  } else {
    // Electron desktop
    instance = new SQLiteService();
  }

  return instance;
}
```

## Step 6: Create Mobile API Bridge

Create `src/renderer/utils/mobileApi.ts`:

```typescript
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { LocalNotifications } from '@capacitor/local-notifications';

export const mobileApi = {
  platform: Capacitor.getPlatform(),

  async readFile(path: string): Promise<string> {
    if (Capacitor.getPlatform() === 'web') return '';
    const file = await Filesystem.readFile({
      path,
      directory: Directory.Data,
    });
    return file.data as string;
  },

  async writeFile(path: string, data: string): Promise<void> {
    if (Capacitor.getPlatform() === 'web') return;
    await Filesystem.writeFile({
      path,
      data,
      directory: Directory.Data,
    });
  },

  async showNotification(title: string, body: string): Promise<void> {
    if (Capacitor.getPlatform() === 'web') return;
    await LocalNotifications.schedule({
      notifications: [
        {
          title,
          body,
          id: Date.now(),
        },
      ],
    });
  },
};
```

## Step 7: Update Main Entry Point

Modify `src/renderer/main.tsx` to detect platform:

```typescript
import { Capacitor } from '@capacitor/core';

// Detect platform and use appropriate API
if (Capacitor.isNativePlatform()) {
  // Mobile - use Capacitor plugins
  window.api = mobileApi;
} else if (typeof window.api === 'undefined') {
  // Web fallback
  window.api = {
    /* existing web shim */
  };
}
```

## Step 8: Update package.json Scripts

Add mobile scripts:

```json
{
  "scripts": {
    "build:mobile": "npm run build && npx cap sync",
    "build:android": "npm run build:mobile && npx cap open android",
    "android:dev": "npm run build:mobile && npx cap run android"
  }
}
```

## Step 9: Build for Android

```bash
# 1. Build the web app
npm run build

# 2. Sync with Capacitor
npx cap sync

# 3. Open Android Studio
npx cap open android

# 4. In Android Studio:
#    - Wait for Gradle sync
#    - Click "Run" button (green play icon)
#    - Select a device/emulator
#    - APK will be generated automatically
```

## Step 10: UI Adjustments for Mobile

Your Fluent UI components should work, but consider:

1. **Responsive Layout**: The ribbon might need mobile navigation
2. **Touch Targets**: Ensure buttons are at least 44x44px
3. **Keyboard**: Use `@capacitor/keyboard` for better UX
4. **Status Bar**: Configure in `capacitor.config.ts`

## Alternative: Quick Web Version

If you want a simpler approach without native features:

1. Deploy your built `dist/renderer` to a web server
2. Access it from mobile browser
3. Add PWA manifest for "Add to Home Screen"

## Troubleshooting

- **Database errors**: Ensure `@capacitor-community/sqlite` is properly installed
- **Build errors**: Check Android SDK is installed in Android Studio
- **API not found**: Verify Capacitor plugins are synced: `npx cap sync`

## Next Steps

1. Test on Android emulator first
2. Adjust UI for smaller screens
3. Add mobile-specific features (camera, barcode scanner, etc.)
4. Publish to Google Play Store

## Resources

- [Capacitor Docs](https://capacitorjs.com/docs)
- [Capacitor Android Setup](https://capacitorjs.com/docs/android)
- [SQLite Plugin](https://github.com/capacitor-community/sqlite)
