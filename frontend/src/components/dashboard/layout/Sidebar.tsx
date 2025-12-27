import { NavLink } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { sidebarItems } from './sidebarItems';
import { useSidebar } from '../../../store/useSidebar';
import { RoleBasedRender } from '../auth/RoleBasedRender';

export const Sidebar = () => {
  const { collapsed, toggle } = useSidebar();

  return (
    <aside
      className={`
        h-screen bg-[#0F172A] text-white
        transition-all duration-300
        ${collapsed ? 'w-20' : 'w-64'}
        hidden md:flex flex-col
      `}
    >
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-white/10">
        {!collapsed && <span className="font-bold">Dashboard</span>}
        <button onClick={toggle}>
          <Menu size={18} />
        </button>
      </div>

      {/* Links */}
      <nav className="flex-1 p-2 space-y-1">
        {sidebarItems.map(item => {
          const Icon = item.icon;

          return (
            <RoleBasedRender
              key={item.to}
              permission={item.permission}
            >
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `
                  group relative flex items-center gap-3 px-3 py-2 rounded-md
                  transition-colors
                  ${
                    isActive
                      ? 'bg-white/10'
                      : 'hover:bg-white/5'
                  }
                `
                }
              >
                <Icon size={20} />

                {!collapsed && (
                  <span className="text-sm">
                    {item.label}
                  </span>
                )}

                {/* Tooltip cuando está colapsado */}
                {collapsed && (
                  <span
                    className="
                      absolute left-20 bg-black text-xs px-2 py-1 rounded
                      opacity-0 group-hover:opacity-100
                      pointer-events-none
                      whitespace-nowrap
                    "
                  >
                    {item.label}
                  </span>
                )}
              </NavLink>
            </RoleBasedRender>
          );
        })}
      </nav>
    </aside>
  );
};
