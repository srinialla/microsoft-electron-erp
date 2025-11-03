import React from 'react';
import { Toast, Toaster, useId, useToastController } from '@fluentui/react-components';

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const toasterId = useId('toaster');
  const { dispatchToast } = useToastController(toasterId);

  React.useEffect(() => {
    if (!window.api?.updates) return;
    const off = window.api.updates.on((evt) => {
      if (evt.event === 'error') {
        dispatchToast(<Toast>Update error: {evt.message}</Toast>, { intent: 'error' });
      }
      if (evt.event === 'update-available') {
        dispatchToast(<Toast>Update {evt.info.version} available</Toast>, { intent: 'info' });
      }
    });
    return () => off();
  }, [dispatchToast]);

  return (
    <>
      {children}
      <Toaster toasterId={toasterId} />
    </>
  );
};
