import { LogOut, User } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';


export const Topbar = () => {
    const { user, logout } = useAuth();

    return (
    <header className="h-14 bg-white border-b flex items-center justify-between px-6">
        <h1 className="font-semibold">Dashboard</h1>

        <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm">
            <User size={16} />
            <span>{user?.name}</span>
        </div>

        <button
        onClick={logout}
        className="flex items-center gap-1 text-sm text-red-600 hover:underline"
        >
            <LogOut size={16} /> Salir
        </button>
        </div>
    </header>
    );
};