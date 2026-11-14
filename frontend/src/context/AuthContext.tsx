import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '../utils/api.js';
import { UserProfile } from '@tunescope/shared';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string, displayName: string) => Promise<void>;
  demoLogin: () => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('tunescope_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    const storedToken = localStorage.getItem('tunescope_token');
    if (!storedToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const data = await apiFetch<{ user: UserProfile }>('/auth/me');
      setUser(data.user);
    } catch {
      localStorage.removeItem('tunescope_token');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();

    const handleAuthExpired = () => {
      setToken(null);
      setUser(null);
    };

    window.addEventListener('tunescope:auth_expired', handleAuthExpired);
    return () => window.removeEventListener('tunescope:auth_expired', handleAuthExpired);
  }, []);

  const login = async (email: string, password: string) => {
    const data = await apiFetch<{ token: string; user: UserProfile }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    localStorage.setItem('tunescope_token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const register = async (email: string, password: string, username: string, displayName: string) => {
    const data = await apiFetch<{ token: string; user: UserProfile }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, username, displayName }),
    });

    localStorage.setItem('tunescope_token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const demoLogin = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch<{ token: string; user: UserProfile }>('/auth/demo-login', {
        method: 'POST',
      });

      localStorage.setItem('tunescope_token', data.token);
      setToken(data.token);
      setUser(data.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('tunescope_token');
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    const data = await apiFetch<{ user: UserProfile }>('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    setUser(data.user);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        demoLogin,
        logout,
        updateProfile,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

