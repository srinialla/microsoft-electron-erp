# Microsoft Electron ERP Desktop

<div align="center">

![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.17.0-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)
![React](https://img.shields.io/badge/React-18.3-blue.svg)

**Modern cross-platform ERP system with Microsoft Office-style navigation and ribbon interface**

[Features](#-features) • [Installation](#-installation) • [Documentation](#-documentation) • [Contributing](#-contributing)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Platform Support](#-platform-support)
- [Modules & Functionalities](#-modules--functionalities)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Development](#-development)
- [Building](#-building)
- [Project Structure](#-project-structure)
- [Database Architecture](#-database-architecture)
- [Configuration](#-configuration)
- [Keyboard Shortcuts](#-keyboard-shortcuts)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)
- [Support](#-support)

---

## 🎯 Overview

**Microsoft Electron ERP** is a comprehensive Enterprise Resource Planning (ERP) system designed with a modern, intuitive interface inspired by Microsoft Office. The application provides complete business management capabilities including inventory, sales, purchases, accounting, customer relationship management, and comprehensive reporting.

### Key Highlights

- 🎨 **Modern UI/UX**: Microsoft Office-style ribbon interface with intuitive navigation
- 🌐 **Cross-Platform**: Runs on Web (PWA), Desktop (Electron), and Mobile (Capacitor)
- 💾 **Offline-First**: Local database support with automatic sync capabilities
- ⚡ **High Performance**: Built with React 18, TypeScript, and Vite for optimal performance
- 🔒 **Secure**: Type-safe codebase with comprehensive validation
- 📱 **Progressive Web App**: Installable on any device, works offline

---

## 🚀 Features

### Core Features

- **Multi-Platform Support**
  - ✅ Web (Progressive Web App)
  - ✅ Desktop (Windows, macOS, Linux via Electron)
  - ✅ Mobile (Android & iOS via Capacitor)

- **Modern Interface**
  - Microsoft Office-style Ribbon navigation (88px total height)
  - Custom title bar with window controls
  - Responsive design for all screen sizes
  - Dark/Light theme support
  - Accessible design (ARIA labels, keyboard navigation)

- **Offline Capabilities**
  - Local database (SQLite for desktop/mobile, IndexedDB for web)
  - Service worker for offline web support
  - Automatic data synchronization
  - Data persistence across sessions

- **System Integration**
  - Connection status monitoring (Online/Offline/Syncing/Error)
  - Notification center with categories
  - User profile management
  - Auto-updater (desktop)
  - Push notifications (mobile)

---

## 📦 Platform Support

### 🌐 Web (Progressive Web App)

- **Installable** on any modern browser
- **Offline Support** via service worker
- **IndexedDB** for local storage
- **HTTPS Required** for full PWA features
- **Responsive** design for mobile and desktop browsers

**Supported Browsers:**

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Opera (latest)

### 💻 Desktop (Electron)

- **Windows** (Windows 10+)
- **macOS** (10.13+)
- **Linux** (Ubuntu 18.04+, Debian 10+, Fedora 30+)

**Features:**

- Native window controls
- System tray integration
- Auto-updater support
- Native notifications
- File system access
- SQLite database

### 📱 Mobile (Capacitor)

- **Android** (5.0+ / API 21+)
- **iOS** (12.0+)

**Features:**

- Native SQLite database
- Native device APIs (camera, filesystem, etc.)
- Push notifications
- App Store distribution ready

---

## 📚 Modules & Functionalities

### 🏠 Dashboard

- Real-time statistics overview
- Sales charts and analytics
- Recent transactions widget
- Stock alerts and low inventory warnings
- Top products performance
- Quick action cards

### 👥 Customers

- **Customer Management**
  - Create, edit, and view customer profiles
  - Customer code generation
  - Contact information management
  - Credit limit tracking
  - Customer list with search and filters
  - Customer transaction history

### 📦 Inventory

- **Product Management**
  - Product catalog with categories
  - Product variants and attributes
  - Barcode support
  - Unit of measure management
  - Cost and pricing management

- **Stock Management**
  - Stock level tracking
  - Stock adjustments (add/remove)
  - Stock transfers between locations
  - Physical inventory count
  - Stock valuation reports
  - Low stock alerts

- **Bulk Operations**
  - Import products from CSV/Excel
  - Bulk price updates
  - Batch stock adjustments

### 💰 Sales

- **Sales Documents**
  - Quotations (create, edit, convert to orders)
  - Sales Orders (order management and fulfillment)
  - Invoices (generate, print, email)
  - Delivery Notes
  - Sales Returns (RMA management)
  - Payment Receipts

- **Features**
  - Line item management
  - Discounts and taxes
  - Multiple payment methods
  - Payment allocation
  - Document status tracking
  - Invoice preview and printing

### 🛒 Purchases

- **Purchase Management**
  - Purchase Orders (create, approve, track)
  - Goods Received Notes (GRN)
  - Purchase Returns
  - Vendor management
  - Purchase reports and analytics

- **Vendor Management**
  - Vendor profiles
  - Vendor performance tracking
  - Payment terms management
  - Purchase history

### 💵 Accounting

- **Financial Management**
  - Journal Entries (manual entries)
  - Payment Vouchers
  - Receipt Vouchers
  - Bank Deposits
  - Bank Withdrawals
  - Bank Reconciliation

- **Financial Reports**
  - Trial Balance
  - Profit & Loss Statement
  - Balance Sheet
  - Cash Flow Statement
  - Account-wise reports

### 📊 Reports

- **Sales Reports**
  - Sales Summary
  - Sales by Customer
  - Sales by Product
  - Sales by Period
  - Sales Trends

- **Financial Reports**
  - Income Statement
  - Balance Sheet
  - Cash Flow
  - Financial Ratios

- **Inventory Reports**
  - Stock Report
  - Stock Valuation
  - Movement Analysis

- **Export Options**
  - Excel Export
  - PDF Export
  - Print Reports

### ⚙️ Settings

- **Company Settings**
  - Company Profile (name, address, contact)
  - Default Currency (with app-wide currency support)
  - Tax Settings (multiple tax rates, compound taxes)
  - Branch Management

- **System Settings**
  - User & Role Management
  - Units of Measure
  - Theme Settings (Light/Dark)
  - Database Management
  - Auto-update Configuration

---

## 🛠️ Tech Stack

### Frontend

- **React 18.3** - UI library
- **TypeScript 5.6** - Type-safe development
- **React Router DOM 6.28** - Client-side routing
- **Fluent UI 9.72** - Microsoft design system components
- **Zustand 4.5** - State management
- **Zod 3.23** - Schema validation

### Backend & Database

- **Electron 31.3** - Desktop framework
- **Capacitor 7.4** - Mobile framework
- **SQLite** (better-sqlite3 11.7) - Desktop database
- **IndexedDB** - Web database
- **Capacitor SQLite** - Mobile database

### Build Tools

- **Vite 5.4** - Build tool and dev server
- **TypeScript** - Type checking
- **TSup 8.3** - TypeScript bundler
- **ESLint** - Code linting
- **Prettier** - Code formatting

### Additional Tools

- **Electron Builder** - Desktop app packaging
- **Vite PWA Plugin** - PWA support
- **Concurrently** - Run multiple processes
- **Electron Log** - Logging
- **Electron Updater** - Auto-updates

---

## 📋 Prerequisites

### Required

- **Node.js** >= 18.17.0 ([Download](https://nodejs.org/))
- **npm** >= 9.0.0 (comes with Node.js)

### Platform-Specific

#### For Desktop Development

- **Windows**: No additional requirements
- **macOS**: Xcode Command Line Tools (`xcode-select --install`)
- **Linux**: Build essentials (varies by distribution)

#### For Mobile Development (Android)

- **Android Studio** ([Download](https://developer.android.com/studio))
- **Android SDK** (installed via Android Studio)
- **Java JDK 11+** (included with Android Studio)

#### For Mobile Development (iOS) - macOS Only

- **Xcode** 12.0+ ([App Store](https://apps.apple.com/us/app/xcode/id497799835))
- **CocoaPods** (`sudo gem install cocoapods`)

---

## 💻 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/srinialla/microsoft-electron-erp.git
cd microsoft-electron-erp
```

### 2. Install Dependencies

```bash
npm install
```

This will automatically:

- Install all npm dependencies
- Install Electron native dependencies
- Set up development environment

### 3. Verify Installation

```bash
npm run dev
```

Select option **2** (Web app) to verify everything works.

---

## 🔧 Development

### Development Modes

The project supports three development modes:

```bash
npm run dev
```

This will prompt you to select:

1. **Electron app (desktop)** - Full desktop development with hot reload
2. **Web app (browser)** - Web development with Vite dev server
3. **Mobile app (Capacitor)** - Builds and syncs for mobile development

### Individual Commands

```bash
# Web development (fastest)
npm run dev:web

# Desktop development (with Electron)
npm run dev:electron

# Mobile development (builds and syncs)
npm run build:mobile
```

### Development Features

- ⚡ **Hot Module Replacement (HMR)** - Instant updates
- 🐛 **Source Maps** - Easy debugging
- 📝 **TypeScript** - Type checking
- 🎨 **CSS Support** - Full CSS and CSS modules
- 🔍 **ESLint** - Code quality checks

### Code Quality

```bash
# Lint code
npm run lint

# Format code
npm run format
```

---

## 🏗️ Building

### Web Build

```bash
# Production build
npm run build:web

# Output: dist/renderer/
```

### Desktop Build

```bash
# Build all platforms
npm run build

# Package for distribution
npm run package

# Output: release/
# Windows: .exe installer
# macOS: .dmg
# Linux: .AppImage, .deb
```

### Mobile Build

#### Android

```bash
# Build and open Android Studio
npm run build:android

# Or run directly on device/emulator
npm run android:dev
```

**In Android Studio:**

1. Wait for Gradle sync
2. Click "Run" (green play icon)
3. Select device/emulator
4. APK will be generated in `android/app/build/outputs/apk/`

#### iOS (macOS only)

```bash
# Build and open Xcode
npm run build:ios

# Or run directly on device/simulator
npm run ios:dev
```

**In Xcode:**

1. Select target device
2. Click "Run" (play button)
3. App will build and launch

### Build Scripts Reference

```bash
npm run build              # Build for web + desktop
npm run build:web          # Build web only
npm run build:mobile       # Build and sync for mobile
npm run build:android      # Build and open Android Studio
npm run build:ios          # Build and open Xcode
npm run android:dev        # Build and run on Android
npm run ios:dev            # Build and run on iOS
npm run cap:sync           # Sync Capacitor
npm run package            # Package desktop app
```

---

## 📁 Project Structure

```
microsoft-electron-erp/
├── src/
│   ├── main/              # Electron main process
│   │   └── index.ts       # Main entry point
│   ├── preload/            # Electron preload scripts
│   │   └── index.ts       # IPC bridge
│   ├── renderer/           # React application
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── routes/         # Routing configuration
│   │   ├── stores/         # Zustand stores
│   │   ├── utils/          # Utility functions
│   │   └── main.tsx        # React entry point
│   ├── modules/            # Feature modules
│   │   ├── accounting/     # Accounting module
│   │   ├── customers/      # Customers module
│   │   ├── dashboard/      # Dashboard module
│   │   ├── inventory/      # Inventory module
│   │   ├── purchases/      # Purchases module
│   │   ├── reports/        # Reports module
│   │   ├── sales/          # Sales module
│   │   └── settings/       # Settings module
│   ├── services/           # Business logic services
│   │   └── database/       # Database abstraction
│   │       ├── sqlite/     # SQLite implementation
│   │       ├── indexeddb/ # IndexedDB implementation
│   │       └── capacitor/ # Capacitor SQLite implementation
│   └── shared/             # Shared code
│       ├── components/     # Shared components
│       ├── utils/          # Shared utilities
│       └── types/          # TypeScript types
├── resources/              # App resources
│   └── icon.png           # App icon
├── dist/                   # Build output
├── capacitor.config.ts     # Capacitor configuration
├── electron-builder.yml    # Electron builder config
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Project dependencies
```

---

## 🗄️ Database Architecture

### Platform-Specific Databases

The application automatically selects the appropriate database based on the platform:

| Platform               | Database  | Implementation                |
| ---------------------- | --------- | ----------------------------- |
| **Desktop (Electron)** | SQLite    | `better-sqlite3` via IPC      |
| **Mobile (Capacitor)** | SQLite    | `@capacitor-community/sqlite` |
| **Web (Browser)**      | IndexedDB | Browser native API            |

### Database Abstraction

All database operations go through a unified `DatabaseService` interface:

```typescript
// Automatically detects platform and uses correct implementation
const db = getDatabaseService();
await db.initialize();

// Same API works across all platforms
await db.insert('products', productData);
const products = await db.findAll('products');
```

### Schema

The database includes tables for:

- Users and authentication
- Settings and configuration
- Customers
- Products and inventory
- Sales documents (quotations, orders, invoices)
- Purchase documents (orders, GRNs, returns)
- Accounting entries
- Transactions and logs

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Development
VITE_DEV_SERVER_URL=http://localhost:5173

# Production
VITE_API_URL=https://api.example.com
```

### Capacitor Configuration

Edit `capacitor.config.ts` to customize:

- App ID and name
- Splash screen settings
- Status bar appearance
- Keyboard behavior

### Electron Builder Configuration

Edit `electron-builder.yml` to customize:

- App metadata
- Build targets
- Installer options
- Code signing (for distribution)

---

## ⌨️ Keyboard Shortcuts

### Global Shortcuts

| Shortcut       | Action            |
| -------------- | ----------------- |
| `Ctrl/Cmd + S` | Save              |
| `Ctrl/Cmd + P` | Print             |
| `Ctrl/Cmd + F` | Find/Search       |
| `Ctrl/Cmd + N` | New document      |
| `Ctrl/Cmd + W` | Close window      |
| `F5`           | Refresh           |
| `F11`          | Toggle fullscreen |

### Navigation

- **Tab navigation** - Navigate between ribbon tabs
- **Arrow keys** - Navigate within ribbon groups
- **Enter** - Activate selected button
- **Esc** - Close dialogs/modals

---

## 🚀 Deployment

### Web (PWA) Deployment

1. **Build the application:**

   ```bash
   npm run build:web
   ```

2. **Deploy `dist/renderer/` to a web server:**
   - AWS S3 + CloudFront
   - Netlify
   - Vercel
   - GitHub Pages
   - Any static hosting

3. **Ensure HTTPS** (required for PWA features)

4. **Users can install** via "Add to Home Screen"

### Desktop Distribution

1. **Build the application:**

   ```bash
   npm run build
   ```

2. **Package for distribution:**

   ```bash
   npm run package
   ```

3. **Sign the application** (optional but recommended)

4. **Distribute via:**
   - GitHub Releases
   - Website download
   - App stores (Microsoft Store, Mac App Store, etc.)

### Mobile Distribution

#### Android (Google Play Store)

1. Build release APK/AAB:

   ```bash
   npm run build:mobile
   cd android
   ./gradlew bundleRelease  # For AAB
   # or
   ./gradlew assembleRelease  # For APK
   ```

2. Sign the bundle/APK

3. Upload to Google Play Console

#### iOS (App Store)

1. Build in Xcode:

   ```bash
   npm run build:ios
   ```

2. Archive the app in Xcode

3. Upload to App Store Connect

4. Submit for review

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

### Getting Started

1. **Fork the repository**

2. **Create a feature branch:**

   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**

4. **Test your changes:**

   ```bash
   npm run lint
   npm run dev:web  # Test web
   npm run dev:electron  # Test desktop
   ```

5. **Commit your changes:**

   ```bash
   git commit -m "Add: description of your feature"
   ```

6. **Push to your fork:**

   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create a Pull Request**

### Coding Standards

- Follow TypeScript best practices
- Use ESLint and Prettier configurations
- Write meaningful commit messages
- Add comments for complex logic
- Update documentation as needed

### Reporting Issues

Use GitHub Issues to report bugs or request features. Include:

- Description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Platform information
- Screenshots (if applicable)

---

## 📄 License

This project is licensed under the **MIT License**.

See [LICENSE](LICENSE) file for details.

---

## 📞 Support

### Documentation

- [User Guide](docs/USER_GUIDE.md)
- [Developer Guide](docs/DEVELOPER_GUIDE.md)
- [API Documentation](docs/API.md)
- [Mobile Setup Guide](MOBILE_SETUP_GUIDE.md)
