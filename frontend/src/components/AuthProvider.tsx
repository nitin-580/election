'use client';

import React, { createContext, useContext, useEffect, useState, useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { User } from '../types';
import api from '../lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('election_token');
      const cachedUser = localStorage.getItem('election_user');

      if (token && cachedUser) {
        setUser(JSON.parse(cachedUser));
        // Verify token with backend
        try {
          const res = await api.get('/auth/me');
          setUser(res.data);
          localStorage.setItem('election_user', JSON.stringify(res.data));
        } catch (err) {
          // Token expired or invalid
          localStorage.removeItem('election_token');
          localStorage.removeItem('election_user');
          setUser(null);
          if (pathname !== '/login') {
            router.push('/login');
          }
        }
      } else {
        if (pathname !== '/login') {
          router.push('/login');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [pathname, router]);

  const login = async (username: string, password: string) => {
    const res = await api.post('/auth/login', { username, password });
    const { token, user: loggedUser } = res.data;
    
    localStorage.setItem('election_token', token);
    localStorage.setItem('election_user', JSON.stringify(loggedUser));
    setUser(loggedUser);
    
    startTransition(() => {
      router.push('/');
    });
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.warn('Backend logout call failed, logging out locally anyway.');
    }
    localStorage.removeItem('election_token');
    localStorage.removeItem('election_user');
    setUser(null);
    startTransition(() => {
      router.push('/login');
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
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
