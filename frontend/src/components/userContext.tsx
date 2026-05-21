import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { User } from '../../api';
import { clearAccessToken, getAccessToken, setAccessToken } from '../../api/instance';

type UserContextValue = {
    token: string | null;
    user: User | null;
    isLoggedIn: boolean;
    setAuth: (token: string, user?: User | null) => void;
    clearAuth: () => void;
};

const UserContext = createContext<UserContextValue | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
    const [token, setToken] = useState<string | null>(() => getAccessToken());
    const [user, setUser] = useState<User | null>(null);

    const setAuth = useCallback((nextToken: string, nextUser?: User | null) => {
        setToken(nextToken);
        setUser(nextUser ?? null);
        setAccessToken(nextToken);
    }, []);

    const clearAuth = useCallback(() => {
        setToken(null);
        setUser(null);
        clearAccessToken();
    }, []);

    const value = useMemo(
        () => ({
            token,
            user,
            isLoggedIn: Boolean(token),
            setAuth,
            clearAuth,
        }),
        [token, user, setAuth, clearAuth]
    );

    return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useUserContext = () => {
    const ctx = useContext(UserContext);
    if (!ctx) {
        throw new Error('useUserContext must be used within UserProvider');
    }
    return ctx;
};
