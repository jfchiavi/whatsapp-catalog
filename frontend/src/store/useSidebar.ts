import { create } from 'zustand';

interface SidebarState {
  collapsed: boolean;
  toggle: () => void;
  close: () => void;
}

export const useSidebar = create<SidebarState>(set => ({
  collapsed: false,
  toggle: () => set(state => ({ collapsed: !state.collapsed })),
  close: () => set({ collapsed: true }),
}));
