export interface RibbonConfig {
  tabs: RibbonTab[];
}

export interface RibbonTab {
  id: string;
  label: string;
  groups: RibbonGroup[];
  visible?: boolean;
  badgeCount?: number;
  contextual?: boolean;
  accent?: boolean;
}

export interface RibbonGroup {
  id: string;
  label: string;
  items: RibbonItem[];
  visible?: boolean;
}

export type RibbonItemType = 'button' | 'split-button' | 'dropdown' | 'toggle' | 'input';

export interface RibbonItem {
  id: string;
  type: RibbonItemType;
  label: string;
  icon: string;
  size: 'small' | 'medium' | 'large';
  enabled?: boolean;
  visible?: boolean;
  tooltip?: string;
  shortcut?: string;
  onClick?: string;
  children?: RibbonItem[];
  role?: 'primary' | 'secondary';
}

export type ActionHandler = (payload?: any) => void | Promise<void>;
export type ActionRegistry = Record<string, ActionHandler>;
