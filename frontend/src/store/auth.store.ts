import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser } from '../types/auth';


interface AuthState {
    user: AuthUser | null;
    token: string | null;
    isAuthenticated: boolean;
    login: (user: AuthUser, token: string) => void;
    logout: () => void;
}

/* Zustand store for authentication state 
*** El store guarda:
- user
- token
- isAuthenticated
*/

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            login: (user, token) => set({ user, token, isAuthenticated: true }),
            logout: () => { set({ user: null, token: null, isAuthenticated: false });
              localStorage.removeItem('refreshToken');
            },
        }),
        { name: 'auth-storage' }
    )
);

