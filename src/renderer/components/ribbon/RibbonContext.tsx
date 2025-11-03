import React from 'react';
import type { RibbonConfig, ActionRegistry } from './types';

export type RibbonState = {
  activeTabId: string;
  collapsed: boolean;
  displayMode: 'full' | 'tabs' | 'auto';
};

export const RibbonContext = React.createContext<{
  config: RibbonConfig;
  actions: ActionRegistry;
  state: RibbonState;
  setActiveTab: (id: string) => void;
  setDisplayMode: (mode: RibbonState['displayMode']) => void;
}>({
  config: { tabs: [] },
  actions: {},
  state: { activeTabId: 'home', collapsed: false, displayMode: 'full' },
  setActiveTab: () => undefined,
  setDisplayMode: () => undefined,
});

export const RibbonProvider: React.FC<{
  config: RibbonConfig;
  actions: ActionRegistry;
  initialTab?: string;
  children: React.ReactNode;
}> = ({ config, actions, initialTab = 'home', children }) => {
  const [state, setState] = React.useState<RibbonState>(() => {
    const saved = localStorage.getItem('ribbonDisplayMode');
    const allowed = new Set(['full', 'tabs', 'auto']);
    const displayMode = allowed.has(saved || '') ? (saved as RibbonState['displayMode']) : 'full';
    if (!allowed.has(saved || '')) {
      localStorage.setItem('ribbonDisplayMode', displayMode);
    }
    return {
      activeTabId: localStorage.getItem('ribbonActiveTab') || initialTab,
      collapsed: false,
      displayMode,
    };
  });

  const setActiveTab = (id: string) => {
    localStorage.setItem('ribbonActiveTab', id);
    setState((s) => ({ ...s, activeTabId: id }));
  };

  const setDisplayMode = (mode: RibbonState['displayMode']) => {
    setState((s) => ({ ...s, displayMode: mode }));
    localStorage.setItem('ribbonDisplayMode', mode);
  };

  return (
    <RibbonContext.Provider value={{ config, actions, state, setActiveTab, setDisplayMode }}>
      {children}
    </RibbonContext.Provider>
  );
};
