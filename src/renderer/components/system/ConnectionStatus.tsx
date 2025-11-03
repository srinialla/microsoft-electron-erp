import React from 'react';
import {
  Wifi120Regular,
  WifiOff20Regular,
  ArrowClockwise20Regular,
  Warning20Regular,
} from '@fluentui/react-icons';

export interface ConnectionStatusProps {
  isOnline: boolean;
  isSyncing?: boolean;
  errorMessage?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isOnline,
  isSyncing = false,
  errorMessage,
}) => {
  let content: React.ReactNode = null;
  let title = '';

  if (errorMessage) {
    content = <Warning20Regular color={'var(--ms-warning)'} />;
    title = errorMessage;
  } else if (isSyncing) {
    content = <ArrowClockwise20Regular color={'#0078D4'} className="spin" />;
    title = 'Syncing...';
  } else if (isOnline) {
    content = <Wifi120Regular color={'#107C10'} />;
    title = 'Connected';
  } else {
    content = <WifiOff20Regular color={'#E81123'} />;
    title = 'Offline';
  }

  return (
    <div className="status-indicator" title={title} aria-label={title} role="status">
      <div className="status-visual" aria-hidden>
        {content}
      </div>
      <style>{`
        .spin { animation: cs-rotate 1s linear infinite; }
        @keyframes cs-rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};
