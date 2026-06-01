import { createContext, useContext, useEffect, useState } from 'react';
import * as authApi from '../api/auth';
import { clearSession, getStoredUser, setSession } from '../storage/tokens';
import { clearApplied } from '../storage/applied';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => getStoredUser());
    const [isLoading] = useState(false);

    const login = async (credentials) => {
        const res = await authApi.login(credentials);
        const { accessToken, refreshToken, user: u } = res.data.data;
        setSession({ accessToken, refreshToken, user: u });
        setUser(u);
    };

    const register = async (credentials) => {
        const res = await authApi.register(credentials);
        const { accessToken, refreshToken, user: u } = res.data.data;
        setSession({ accessToken, refreshToken, user: u });
        setUser(u);
    };

    const logout = () => {
        clearSession();
        clearApplied();
        setUser(null);
    };

    useEffect(() => {
        const handler = () => logout();
        window.addEventListener('auth:unauthorized', handler);
        return () => window.removeEventListener('auth:unauthorized', handler);
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isLoading,
                login,
                register,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
