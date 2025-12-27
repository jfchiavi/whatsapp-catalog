import { useAuthStore } from '../store/auth.store';


export const useAuth = () => {
    const { user, token, isAuthenticated, login, logout } = useAuthStore();


    return {
        user,
        token,
        isAuthenticated,
        login,
        logout,
        role: user?.role,
        branchId: user?.branchId,
    };
};