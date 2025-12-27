import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../../store/auth.store';

//TODO:// Extensible si querés proteger rutas por permisos específicos

export const ProtectedRoute = () => {
    const isAuthenticated = useAuthStore(s => s.isAuthenticated);
    return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};