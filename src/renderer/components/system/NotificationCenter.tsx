import React from 'react';
import { Alert16Regular, Settings16Regular, Mail16Regular } from '@fluentui/react-icons';
import type { Notification } from '@shared/ipc';

export type NotificationCategory = 'System' | 'Sales' | 'Inventory' | 'HR' | 'Accounting';

export interface CategorizedNotification extends Notification {
  category: NotificationCategory;
  avatarUrl?: string;
  iconName?: string;
}

export interface NotificationCenterProps {
  notifications: CategorizedNotification[];
  onMarkAllAsRead: () => void | Promise<void>;
  onMarkRead: (id: string) => void | Promise<void>;
  onView: (id: string) => void;
  onDismiss: (id: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onMarkAllAsRead,
  onMarkRead,
  onView,
  onDismiss,
}) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => n.unread).length;

  React.useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const grouped = React.useMemo(() => {
    const g = new Map<NotificationCategory, CategorizedNotification[]>();
    const cats: NotificationCategory[] = ['System', 'Sales', 'Inventory', 'HR', 'Accounting'];
    cats.forEach((c) => g.set(c, []));
    for (const n of notifications) {
      const arr = g.get(n.category) || [];
      arr.push(n);
      g.set(n.category, arr);
    }
    return g;
  }, [notifications]);

  return (
    <div className="notification-container" ref={ref}>
      <button
        className="notification-button"
        onClick={() => setOpen((v) => !v)}
        title="Notifications"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls="notification-panel"
      >
        <Alert16Regular />
        {unreadCount > 0 && (
          <div className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</div>
        )}
      </button>
      {open && (
        <div
          id="notification-panel"
          role="dialog"
          aria-label="Notifications"
          className="notification-dropdown"
        >
          <div className="notification-header">
            <span className="notification-title">Notifications</span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button className="mark-all-read" onClick={onMarkAllAsRead}>
                Mark all as read
              </button>
              <button
                className="mark-all-read"
                title="Notification settings"
                aria-label="Notification settings"
              >
                <Settings16Regular />
              </button>
            </div>
          </div>
          <div className="notification-list" role="list">
            {Array.from(grouped.entries()).map(([category, items]) => (
              <div key={category} style={{ borderTop: '1px solid var(--ms-border)' }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--ms-text-secondary)',
                    padding: '8px 12px',
                    background: 'var(--ms-bg-primary)',
                  }}
                >
                  {category}
                </div>
                {items.length === 0 ? (
                  <div className="notification-empty" style={{ padding: 16 }}>
                    No {category.toLowerCase()} notifications
                  </div>
                ) : (
                  items.map((n) => (
                    <div
                      key={n.id}
                      className={`notification-item ${n.unread ? 'unread' : 'read'}`}
                      role="listitem"
                    >
                      <div style={{ display: 'flex', gap: 12 }}>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 4,
                            background: '#f0f0f0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                          }}
                          aria-hidden
                        >
                          {n.avatarUrl ? (
                            <img
                              src={n.avatarUrl}
                              alt=""
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <Mail16Regular />
                          )}
                        </div>
                        <div className="notification-content" style={{ flex: 1 }}>
                          <div
                            className="notification-item-title"
                            style={{ fontWeight: 600, fontSize: 12 }}
                          >
                            {n.title}
                          </div>
                          <div className="notification-item-message" style={{ fontSize: 12 }}>
                            {n.message}
                          </div>
                          <div className="notification-item-time" style={{ fontSize: 11 }}>
                            {n.timestamp}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <button
                            className="mark-all-read"
                            onClick={() => onMarkRead(n.id)}
                            title="Mark read"
                          >
                            Read
                          </button>
                          <button
                            className="mark-all-read"
                            onClick={() => onView(n.id)}
                            title="View"
                          >
                            View
                          </button>
                          <button
                            className="mark-all-read"
                            onClick={() => onDismiss(n.id)}
                            title="Dismiss"
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
