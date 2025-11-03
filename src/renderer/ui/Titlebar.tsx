import React, { useState, useEffect, useRef } from 'react';
import {
  Settings16Regular,
  Person16Regular,
  Keyboard16Regular,
  Star16Regular,
} from '@fluentui/react-icons';
import { ConnectionStatus } from '../components/system/ConnectionStatus';
import type { Notification } from '@shared/ipc';
import {
  NotificationCenter,
  type CategorizedNotification,
} from '../components/system/NotificationCenter';
import './Titlebar.css';

// Icons as SVG components
const MinimizeIcon = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
    <rect x="0" y="4" width="10" height="2" />
  </svg>
);

const MaximizeIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
    <rect
      x="1.5"
      y="1.5"
      width="9"
      height="9"
      stroke="currentColor"
      strokeWidth="1.2"
      fill="none"
      rx="0.5"
    />
  </svg>
);

const RestoreIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
    <rect
      x="2.5"
      y="1.5"
      width="6"
      height="6"
      stroke="currentColor"
      strokeWidth="1.1"
      fill="none"
      rx="0.5"
    />
    <rect
      x="4.5"
      y="3.5"
      width="6"
      height="6"
      stroke="currentColor"
      strokeWidth="1.1"
      fill="none"
      rx="0.5"
    />
  </svg>
);

const CloseIcon = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
    <path d="M0 0L10 10M10 0L0 10" stroke="currentColor" strokeWidth="1.2" />
  </svg>
);

// replaced with Fluent icons via ConnectionStatus

const BellIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 1c-1.1 0-2 .9-2 2v.6C4.8 4.1 3.5 5.4 3.5 7v3.5l-1 1V13h11v-1.5l-1-1V7c0-1.6-1.3-2.9-2.5-3.4V3c0-1.1-.9-2-2-2zM6 3c0-.6.4-1 1-1s1 .4 1 1v.5C7.2 3.2 6.6 3 6 3zm4.5 4.5V7c0-1.4-1.1-2.5-2.5-2.5S5.5 5.6 5.5 7v.5h9zM6.5 14c0 .8.7 1.5 1.5 1.5s1.5-.7 1.5-1.5H6.5z" />
  </svg>
);

const SearchIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="currentColor"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M11.5 10.5l3.2 3.2-.9.9-3.2-3.2v-.5l-.2-.2a5 5 0 1 1 .9-.9l.2.2h.5zM2.5 6.5a4 4 0 1 0 8 0 4 4 0 0 0-8 0z" />
  </svg>
);

const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 8c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4zm0 2c-2.7 0-8 1.3-8 4v2h16v-2c0-2.7-5.3-4-8-4z" />
  </svg>
);

const ExitIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M3 3h6v2H5v6h4v2H3V3zm8 0h2v10h-2V9H9V7h2V3z" />
  </svg>
);

// using Fluent icons

// using Fluent icons

// using Fluent icons

// using Fluent icons

// using Fluent icons

interface UserProfile {
  name: string;
  email: string;
  avatar?: string;
  initials: string;
}

export const Titlebar: React.FC = () => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [notifications, setNotifications] = useState<CategorizedNotification[]>([]);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const userProfile: UserProfile = {
    name: 'John Doe',
    email: 'john.doe@company.com',
    initials: 'JD',
  };

  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Check if window is maximized
  useEffect(() => {
    const checkMaximized = async () => {
      const maximized = await window.api.window.isMaximized();
      setIsMaximized(maximized);
    };
    checkMaximized();
  }, []);

  // Load notifications
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const notifs = await window.api.notifications.get();
        // Map some sample categories for demo purposes
        const cats = ['System', 'Sales', 'Inventory', 'HR', 'Accounting'] as const;
        const mapped = (notifs as Notification[]).map((n, i) => ({
          ...n,
          category: cats[i % cats.length],
        }));
        setNotifications(mapped);
      } catch (error) {
        console.error('Failed to load notifications:', error);
      }
    };
    loadNotifications();
  }, []);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Robust connectivity polling (handles captive portals and flaky OS events)
    let isMounted = true;
    const checkConnectivity = async () => {
      setIsSyncing(true);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      try {
        // Lightweight endpoints commonly used for connectivity checks
        const urls = ['https://www.gstatic.com/generate_204', 'https://1.1.1.1/cdn-cgi/trace'];
        let reachable = false;
        for (const url of urls) {
          try {
            const res = await fetch(url, {
              method: 'GET',
              cache: 'no-store',
              signal: controller.signal,
            });
            if (res.ok) {
              reachable = true;
              break;
            }
          } catch {
            // try next url
          }
        }
        if (isMounted) setIsOnline(reachable);
      } catch {
        if (isMounted) setIsOnline(false);
      } finally {
        clearTimeout(timeout);
        if (isMounted) setIsSyncing(false);
      }
    };

    // Initial check and interval
    checkConnectivity();
    const interval = setInterval(checkConnectivity, 10000);

    return () => {
      isMounted = false;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync initial fullscreen
  useEffect(() => {
    (async () => {
      try {
        const fs = await window.api.window.isFullScreen?.();
        setIsFullScreen(!!fs);
        document.body.classList.toggle('app-fullscreen', !!fs);
      } catch {}
    })();
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toLowerCase().includes('mac');
      const mod = isMac ? e.metaKey : e.ctrlKey;
      if (mod && e.key.toLowerCase() === 's') {
        e.preventDefault();
        window.api.notify({ title: 'Save', body: 'Triggered Ctrl/Cmd+S' });
      }
      if (mod && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        window.api.notify({ title: 'Print', body: 'Triggered Ctrl/Cmd+P' });
      }
      if (mod && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        const el = document.querySelector('.titlebar-search input') as HTMLInputElement | null;
        el?.focus();
      }
      if (e.key === 'F5') {
        e.preventDefault();
        window.location.reload();
      }
      if (e.key === 'F11') {
        e.preventDefault();
        window.api.window.toggleFullScreen?.();
        window.api.window.isFullScreen?.().then((fs) => {
          setIsFullScreen(!!fs);
          document.body.classList.toggle('app-fullscreen', !!fs);
        });
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const handleMinimize = () => {
    window.api.window.minimize();
  };

  const handleMaximize = () => {
    window.api.window.maximizeOrRestore();
    setIsMaximized(!isMaximized);
  };

  const handleClose = () => {
    window.api.window.close();
  };

  const handleMarkAllAsRead = async () => {
    try {
      await window.api.notifications.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <div className={`titlebar${isFullScreen ? ' fullscreen' : ''}`}>
      <div className="titlebar-content">
        {/* App Icon and Title */}
        <div className="titlebar-left">
          <div className="app-icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="#0078D4">
              <rect x="2" y="2" width="16" height="16" rx="2" fill="currentColor" />
              <text x="10" y="14" textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">
                E
              </text>
            </svg>
          </div>
          <div className="app-title">ERP Desktop</div>
        </div>

        {/* Center search */}
        <div className="titlebar-center">
          <div className="titlebar-search">
            <span className="search-icon">
              <SearchIcon />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search"
              aria-label="Search"
            />
          </div>
        </div>

        {/* Right side controls */}
        <div className="titlebar-right">
          {/* Connection Status */}
          <ConnectionStatus isOnline={isOnline} isSyncing={isSyncing} errorMessage={undefined} />

          {/* Notifications */}
          <div ref={notificationsRef}>
            <NotificationCenter
              notifications={notifications}
              onMarkAllAsRead={handleMarkAllAsRead}
              onMarkRead={async (id) => {
                await window.api.notifications.markAsRead(id);
                setNotifications((prev) =>
                  prev.map((n) => (n.id === id ? { ...n, unread: false } : n)),
                );
              }}
              onView={(id) => {
                // Placeholder: open details route or modal
                console.log('View notification', id);
              }}
              onDismiss={(id) => {
                setNotifications((prev) => prev.filter((n) => n.id !== id));
              }}
            />
          </div>

          {/* User Profile */}
          <div className="user-profile-container" ref={userMenuRef}>
            <button
              className="user-profile-button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              title="User profile"
            >
              <div className="user-avatar">
                {userProfile.avatar ? (
                  <img src={userProfile.avatar} alt={userProfile.name} />
                ) : (
                  <span className="user-initials">{userProfile.initials}</span>
                )}
              </div>
            </button>

            {showUserMenu && (
              <div className="user-profile-dropdown">
                <div className="user-info-header">
                  <div className="user-info-avatar">
                    {userProfile.avatar ? (
                      <img src={userProfile.avatar} alt={userProfile.name} />
                    ) : (
                      <span className="user-info-initials">{userProfile.initials}</span>
                    )}
                  </div>
                  <div className="user-info-text">
                    <div className="user-info-name">{userProfile.name}</div>
                    <div className="user-info-email">{userProfile.email}</div>
                  </div>
                </div>
                <div className="user-menu-items">
                  <button className="user-menu-item">
                    <Person16Regular />
                    <span>My Profile</span>
                  </button>
                  <button className="user-menu-item">
                    <Settings16Regular />
                    <span>Account Settings</span>
                  </button>
                  <button className="user-menu-item">
                    <Keyboard16Regular />
                    <span>Keyboard Shortcuts</span>
                  </button>
                  <button className="user-menu-item">
                    <Star16Regular />
                    <span>What's New</span>
                  </button>
                  <div className="user-menu-divider" />
                  <button className="user-menu-item sign-out">
                    <ExitIcon />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Window Controls */}
          {!isFullScreen ? (
            <div className="window-controls">
              <button className="window-control" onClick={handleMinimize} title="Minimize">
                <MinimizeIcon />
              </button>
              <button
                className="window-control"
                onClick={handleMaximize}
                title={isMaximized ? 'Restore' : 'Maximize'}
              >
                {isMaximized ? <RestoreIcon /> : <MaximizeIcon />}
              </button>
              <button className="window-control close" onClick={handleClose} title="Close">
                <CloseIcon />
              </button>
            </div>
          ) : (
            <div className="window-controls mini">
              <button
                className="window-control"
                onClick={() => {
                  window.api.window.toggleFullScreen?.();
                  window.api.window.isFullScreen?.().then((fs) => {
                    setIsFullScreen(!!fs);
                    document.body.classList.toggle('app-fullscreen', !!fs);
                  });
                }}
                title="Exit Full Screen"
              >
                <RestoreIcon />
              </button>
              <button className="window-control close" onClick={handleClose} title="Close">
                <CloseIcon />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
