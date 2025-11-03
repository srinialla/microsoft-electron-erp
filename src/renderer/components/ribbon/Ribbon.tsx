import React from 'react';
import { RibbonContext } from './RibbonContext';
import type {
  RibbonItem,
  RibbonGroup as RibbonGroupType,
  RibbonTab as RibbonTabType,
} from './types';
import './ribbon.css';
import {
  Ribbon16Regular,
  ChevronDown16Regular,
  Search24Regular,
  PersonCircle24Regular,
} from '@fluentui/react-icons';
import { NotificationCenter, type CategorizedNotification } from '../system/NotificationCenter';
import * as FluentIcons from '@fluentui/react-icons';
import { useNavigate } from 'react-router-dom';
import { buildRibbonActions } from '../../actions/ribbonActions';

// Office-style icons
const SaveIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M2 2v12h12V4.5L11.5 2H2zm1 1h7.5L12 4.5V12H3V3zm2 2v6h6V5H5zm1 1h4v4H6V6z" />
  </svg>
);

const UndoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 2c-3.3 0-6 2.7-6 6s2.7 6 6 6c1.3 0 2.5-.4 3.5-1.2l-1.1-1.1c-.7.5-1.6.8-2.4.8-2.2 0-4-1.8-4-4s1.8-4 4-4c1.1 0 2.1.4 2.8 1.2L10 5h3V2l-1.5 1.5C10.3 2.2 9.2 2 8 2z" />
  </svg>
);

const RedoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 2c3.3 0 6 2.7 6 6s-2.7 6-6 6c-1.3 0-2.5-.4-3.5-1.2l1.1-1.1c.7.5 1.6.8 2.4.8 2.2 0 4-1.8 4-4s-1.8-4-4-4c-1.1 0-2.1.4-2.8 1.2L6 5H3V2l1.5 1.5C5.7 2.2 6.8 2 8 2z" />
  </svg>
);

const HomeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 2l6 5.5V14h-4v-4H6v4H2V7.5L8 2z" />
  </svg>
);

const InsertIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M2 2v12h12V2H2zm1 1h10v10H3V3zm2 2v6h6V5H5zm1 1h4v4H6V6z" />
  </svg>
);

const DesignIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 1l3 3H5l3-3zM2 6h12v8H2V6zm1 1v6h10V7H3z" />
  </svg>
);

const ViewIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 2C4.5 2 1.7 4.4 1 7.5c.7 3.1 3.5 5.5 7 5.5s6.3-2.4 7-5.5C14.3 4.4 11.5 2 8 2zm0 9c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3z" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
    <path
      d="M2 4l4 4 4-4"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ChevronUpIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
    <path
      d="M2 8l4-4 4 4"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

function useRibbon() {
  return React.useContext(RibbonContext);
}

export interface RibbonProps {
  openDialog: string | null;
  setOpenDialog: (dialog: string | null) => void;
}

export const Ribbon: React.FC<RibbonProps> = ({ openDialog, setOpenDialog }) => {
  const navigate = useNavigate();
  const { config, state, setActiveTab, setDisplayMode } = useRibbon();
  // Use actions from context (already passed down)
  const actions = React.useContext(RibbonContext).actions;
  const [showDisplayMenu, setShowDisplayMenu] = React.useState(false);
  const [isFullScreen, setIsFullScreen] = React.useState(false);
  const [temporaryOpen, setTemporaryOpen] = React.useState(false);
  const [overlayActive, setOverlayActive] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showWebUser, setShowWebUser] = React.useState(false);
  const [notifications, setNotifications] = React.useState<CategorizedNotification[]>([]);
  const displayRef = React.useRef<HTMLDivElement>(null);
  const webActionsRef = React.useRef<HTMLDivElement>(null);
  const isWeb = typeof window !== 'undefined' && window.api?.app?.platform === 'web';

  React.useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (displayRef.current && !displayRef.current.contains(e.target as Node)) {
        setShowDisplayMenu(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const fs = await window.api.window.isFullScreen?.();
        if (mounted && typeof fs === 'boolean') setIsFullScreen(fs);
      } catch {}
    })();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setTemporaryOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      mounted = false;
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  // Close web menus on outside click
  React.useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (webActionsRef.current && !webActionsRef.current.contains(e.target as Node)) {
        setShowWebUser(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);
  const tabs = config.tabs.filter((t) => t.visible !== false);

  const getTabIcon = (tabId: string) => {
    switch (tabId) {
      case 'dashboard':
        return <HomeIcon />;
      case 'home':
        return <HomeIcon />;
      case 'insert':
        return <InsertIcon />;
      case 'layout':
        return <DesignIcon />;
      case 'view':
        return <ViewIcon />;
      default:
        return null;
    }
  };

  const shouldShowCommands = React.useMemo(() => {
    if (state.displayMode === 'full') return true;
    if (state.displayMode === 'tabs') return temporaryOpen;
    // 'auto' keeps ribbon hidden unless temporarily opened
    return temporaryOpen;
  }, [state.displayMode, temporaryOpen]);

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    switch (tabId) {
      case 'dashboard':
        navigate('/');
        break;
      case 'sales':
        navigate('/sales');
        break;
      case 'purchases':
        navigate('/purchases');
        break;
      case 'inventory':
        navigate('/inventory');
        break;
      case 'customers':
        navigate('/customers');
        break;
      case 'reports':
        navigate('/reports');
        break;
      case 'settings':
        navigate('/settings');
        break;
      case 'accounting':
        navigate('/accounting');
        break;
      default:
        break;
    }
    if (state.displayMode === 'tabs' || state.displayMode === 'auto') {
      setTemporaryOpen(true);
    }
  };

  const closeTemporaryIfNeeded = () => {
    if (state.displayMode === 'tabs' || state.displayMode === 'auto') {
      setTemporaryOpen(false);
      setOverlayActive(false);
    }
  };

  const containerOpen = shouldShowCommands && !overlayActive;

  return (
    <div
      className={`ribbon-container ${containerOpen ? 'open' : 'collapsed'} ${overlayActive ? 'overlay' : ''}`}
    >
      <div className="ribbon-header">
        <div className="ribbon-tabs" role="tablist" aria-label="Ribbon tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={state.activeTabId === tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`ribbon-tab ${state.activeTabId === tab.id ? 'active' : ''}`}
            >
              {getTabIcon(tab.id)}
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>
        <div className="ribbon-display" aria-label="Ribbon display options" ref={displayRef}>
          <button
            className="ribbon-display-button"
            title="Ribbon Display Options"
            aria-haspopup="menu"
            aria-expanded={showDisplayMenu}
            onClick={() => setShowDisplayMenu((v) => !v)}
          >
            <Ribbon16Regular />
            <ChevronDown16Regular />
          </button>
          {showDisplayMenu && (
            <div className="ribbon-display-menu" role="menu">
              <button
                role="menuitem"
                onClick={() => {
                  setDisplayMode('auto');
                  setShowDisplayMenu(false);
                }}
              >
                <span style={{ marginRight: 8 }}>{state.displayMode === 'auto' ? '✓' : ''}</span>
                Auto-hide Ribbon
              </button>
              <button
                role="menuitem"
                onClick={() => {
                  setDisplayMode('tabs');
                  setShowDisplayMenu(false);
                }}
              >
                <span style={{ marginRight: 8 }}>{state.displayMode === 'tabs' ? '✓' : ''}</span>
                Show Tabs Only
              </button>
              <button
                role="menuitem"
                onClick={() => {
                  setDisplayMode('full');
                  setShowDisplayMenu(false);
                }}
              >
                <span style={{ marginRight: 8 }}>{state.displayMode === 'full' ? '✓' : ''}</span>
                Show Tabs and Commands
              </button>
              <button
                role="menuitem"
                onClick={() => {
                  setDisplayMode('auto');
                  setTemporaryOpen(true);
                  setOverlayActive(true);
                  setShowDisplayMenu(false);
                }}
              >
                <span style={{ marginRight: 8 }}>{overlayActive ? '✓' : ''}</span>
                Overlay Ribbon
              </button>
              <button
                role="menuitem"
                onClick={async () => {
                  await window.api.window.toggleFullScreen?.();
                  const fs = await window.api.window.isFullScreen?.();
                  setIsFullScreen(!!fs);
                  setShowDisplayMenu(false);
                }}
              >
                <span style={{ marginRight: 8 }}>{isFullScreen ? '✓' : ''}</span>
                {isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
              </button>
            </div>
          )}
        </div>
        {isWeb && (
          <div className="ribbon-web-actions" ref={webActionsRef}>
            <button
              className="ribbon-web-btn"
              title="Search"
              onClick={() => setSearchOpen((v) => !v)}
            >
              <Search24Regular />
            </button>
            {searchOpen && (
              <input
                className="ribbon-search-input"
                type="text"
                autoFocus
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onBlur={() => setSearchOpen(false)}
              />
            )}
            <div style={{ position: 'relative' }}>
              <NotificationCenter
                notifications={notifications}
                onMarkAllAsRead={async () => {
                  await window.api.notifications.markAllAsRead();
                  setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
                }}
                onMarkRead={async (id) => {
                  await window.api.notifications.markAsRead(id);
                  setNotifications((prev) =>
                    prev.map((n) => (n.id === id ? { ...n, unread: false } : n)),
                  );
                }}
                onView={(id) => console.log('View notification', id)}
                onDismiss={(id) => setNotifications((prev) => prev.filter((n) => n.id !== id))}
              />
            </div>
            <button
              className="ribbon-web-btn"
              title="User"
              onClick={() => setShowWebUser((v) => !v)}
            >
              <PersonCircle24Regular />
            </button>
            {showWebUser && (
              <div className="user-profile-dropdown">
                <div className="user-menu-items">
                  <button className="user-menu-item">
                    <span>My Profile</span>
                  </button>
                  <button className="user-menu-item">
                    <span>Account Settings</span>
                  </button>
                  <div className="user-menu-divider" />
                  <button className="user-menu-item sign-out">
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div
        className={`ribbon-body ${shouldShowCommands ? 'open' : 'collapsed'} ${state.displayMode}`}
        onMouseLeave={closeTemporaryIfNeeded}
      >
        {shouldShowCommands && (
          <div className="ribbon-content">
            <div className="ribbon-groups" aria-label="Ribbon group container">
              {tabs
                .find((t) => t.id === state.activeTabId)
                ?.groups.filter((g) => g.visible !== false)
                .map((group) => (
                  <RibbonGroup key={group.id} group={group} />
                ))}
            </div>
          </div>
        )}
      </div>
      {/* New Product and New Vendor now navigate to full pages instead of dialogs */}
    </div>
  );
};

const RibbonGroup: React.FC<{ group: RibbonGroupType }> = ({ group }) => {
  const items = group.items.filter((i) => i.visible !== false);
  if (items.length === 0) {
    return (
      <div className="ribbon-group">
        <div className="ribbon-group-content">
          <div className="ribbon-empty">No tools available</div>
        </div>
        <div className="ribbon-group-label">{group.label}</div>
      </div>
    );
  }
  return (
    <div className="ribbon-group">
      <div className="ribbon-group-content">
        {items.map((item) => (
          <RibbonItemRenderer item={item} key={item.id} />
        ))}
      </div>
      <div className="ribbon-group-label">{group.label}</div>
    </div>
  );
};

const RibbonItemRenderer: React.FC<{ item: RibbonItem }> = ({ item }) => {
  const { actions } = useRibbon();
  const disabled = item.enabled === false;
  const handleClick = () => {
    console.log(
      'RibbonItem click:',
      item.label,
      'key:',
      item.onClick,
      'func:',
      typeof actions[item.onClick],
    );
    if (item.onClick && actions[item.onClick]) {
      actions[item.onClick]();
    }
  };
  const IconCmp = getFluentIcon(item.icon);

  return (
    <button
      className={`ribbon-item ${item.size || 'medium'} ${disabled ? 'disabled' : ''}`}
      disabled={disabled}
      onClick={handleClick}
      title={item.tooltip || item.label}
    >
      <div className="ribbon-item-icon">
        {IconCmp ? <IconCmp /> : <span aria-hidden="true">⬤</span>}
      </div>
      {item.size !== 'small' && <div className="ribbon-item-label">{item.label}</div>}
    </button>
  );
};

// Icon mapper using root-named exports: e.g., 'Save' -> 'Save16Regular'
function getFluentIcon(name?: string): React.FC | null {
  if (!name) return null;
  const key = `${name}16Regular`;
  const Cmp = (FluentIcons as any)[key];
  return Cmp || null;
}
