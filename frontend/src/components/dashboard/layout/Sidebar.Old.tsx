import { Link } from 'react-router-dom';
import { RoleBasedRender } from '../auth/RoleBasedRender';

const linkClass = 'block px-4 py-2 rounded hover:bg-gray-800 text-sm';

export const Sidebar = () => (
    <aside className="w-64 bg-black text-white p-4 space-y-2">
        <h2 className="text-lg font-bold mb-6">Dashboard</h2>
        <RoleBasedRender permission="dashboard">
            <Link to="/dashboard" className={linkClass}>Dashboard</Link>
        </RoleBasedRender>
        <RoleBasedRender permission="products">
            <Link to="/products" className={linkClass}>Productos</Link>
        </RoleBasedRender>
        <RoleBasedRender permission="stock">
            <Link to="/stock" className={linkClass}>Stock</Link>
        </RoleBasedRender>
        <RoleBasedRender permission="sales">
            <Link to="/sales" className={linkClass}>Ventas</Link>
        </RoleBasedRender>
        <RoleBasedRender permission="reports">
            <Link to="/reports" className={linkClass}>Reportes</Link>
        </RoleBasedRender>
    </aside>
);