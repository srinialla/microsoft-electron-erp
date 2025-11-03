import React from 'react';
import { Dialog, DialogSurface, DialogTitle, DialogBody, DialogActions, DialogContent, Button, ProgressBar, Text } from '@fluentui/react-components';

export const UpdateDialog: React.FC = () => {
  const [open, setOpen] = React.useState(false);
  const [status, setStatus] = React.useState<string>('');
  const [progress, setProgress] = React.useState<number>(0);

  React.useEffect(() => {
    if (!window.api?.updates) return;
    const off = window.api.updates.on((evt) => {
      switch (evt.event) {
        case 'checking-for-update':
          setOpen(true);
          setStatus('Checking for updates...');
          break;
        case 'update-available':
          setStatus(`Downloading v${evt.info.version}...`);
          break;
        case 'download-progress':
          setProgress(evt.progress.percent);
          setStatus('Downloading...');
          break;
        case 'update-downloaded':
          setStatus(`Update v${evt.info.version} ready to install`);
          break;
        case 'update-not-available':
          setStatus('You are up to date');
          break;
        case 'error':
          setStatus(`Error: ${evt.message}`);
          break;
      }
    });
    return () => off();
  }, []);

  return (
    <Dialog open={open} onOpenChange={(_, d) => setOpen(d.open)}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Application Update</DialogTitle>
          <DialogContent>
            <Text>{status}</Text>
            <div style={{ marginTop: 12 }}>
              <ProgressBar value={progress / 100} />
            </div>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={() => setOpen(false)}>Close</Button>
            <Button appearance="primary" onClick={() => window.api.updates.quitAndInstall()}>Install and restart</Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
