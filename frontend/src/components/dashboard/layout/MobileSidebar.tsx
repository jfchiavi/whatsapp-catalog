import { NavLink } from 'react-router-dom';
import { SIDEBAR_ITEMS } from '@/config/sidebar.config';
import { RoleBasedRender } from '@/components/dashboard/auth/RoleBasedRender';

export const MobileSidebar = () => {
  return (
    <nav className="
      fixed bottom-0 left-0 right-0
      h-14 bg-[#0F172A]
      flex md:hidden
      justify-around items-center
    ">
      {SIDEBAR_ITEMS.map(item => {
        const Icon = item.icon;

        return (
          <RoleBasedRender
            key={item.path}
            permission={item.permission}
          >
            <NavLink
              to={item.path}
              className="text-white/70 hover:text-white"
            >
              <Icon size={22} />
            </NavLink>
          </RoleBasedRender>
        );
      })}
    </nav>
  );
};
