import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Titlebar } from './Titlebar';
import { Ribbon } from '../components/ribbon/Ribbon';
import { RibbonProvider } from '../components/ribbon/RibbonContext';
import { ribbonConfig } from '../config/ribbonConfig';
import { buildRibbonActions } from '../actions/ribbonActions';
import './AppLayout.css';

export const AppLayout: React.FC = () => {
  const isWeb = typeof window !== 'undefined' && window.api?.app?.platform === 'web';
  const navigate = useNavigate();
  const [openDialog, setOpenDialog] = React.useState<string | null>(null);
  // Always provide setOpenDialog to buildRibbonActions
  const actions = React.useMemo(() => buildRibbonActions(navigate, setOpenDialog), [navigate]);
  return (
    <div className="app-shell">
      {!isWeb && <Titlebar />}
      <RibbonProvider config={ribbonConfig} actions={actions} initialTab="dashboard">
        {/* Pass openDialog and setOpenDialog as props or via context if needed */}
        <Ribbon openDialog={openDialog} setOpenDialog={setOpenDialog} />
      </RibbonProvider>
      <main className="app-content">
        <Outlet />
      </main>
    </div>
  );
};
