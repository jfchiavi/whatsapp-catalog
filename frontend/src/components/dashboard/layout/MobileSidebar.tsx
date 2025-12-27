import { NavLink } from 'react-router-dom';
import { sidebarItems } from './sidebarItems';
import { RoleBasedRender } from '../auth/RoleBasedRender';

export const MobileSidebar = () => {
  return (
    <nav className="
      fixed bottom-0 left-0 right-0
      h-14 bg-[#0F172A]
      flex md:hidden
      justify-around items-center
    ">
      {sidebarItems.map(item => {
        const Icon = item.icon;

        return (
          <RoleBasedRender
            key={item.to}
            permission={item.permission}
          >
            <NavLink
              to={item.to}
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
