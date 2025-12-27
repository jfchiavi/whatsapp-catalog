// Sidebar dinámico por rol
// Topbar con usuario
// <Outlet /> para contenido
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileSidebar } from './MobileSidebar';
import { Topbar } from './Topbar';


export const DashboardLayout = () => {
    return (
    <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <MobileSidebar />
        <div className="flex flex-col flex-1">
            <Topbar />
            <main className="flex-1 overflow-y-auto p-6">
                <Outlet />
            </main>
        </div>
    </div>
    );
};