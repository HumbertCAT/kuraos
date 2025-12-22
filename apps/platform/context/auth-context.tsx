'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { api } from '@/lib/api';
import { User, Organization, LoginRequest, RegisterRequest } from '@/types/auth';

interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (newUser: User) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const data = await api.auth.getMe();
      setUser(data.user || data); // Handle both formats
      if (data.organization) {
        setOrganization(data.organization);
      }
    } catch (error) {
      setUser(null);
      setOrganization(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(data: LoginRequest) {
    const response = await api.auth.login(data);
    setUser(response.user);
    if (response.organization) {
      setOrganization(response.organization);
    }
    router.refresh();
  }

  async function register(data: RegisterRequest) {
    const response = await api.auth.register(data);
    setUser(response.user);
    if (response.organization) {
      setOrganization(response.organization);
    }
    router.refresh();
  }

  async function logout() {
    try {
      await api.auth.logout();
      setUser(null);
      setOrganization(null);
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout failed', error);
    }
  }

  async function updateUser(newUser: User) {
    setUser(newUser);
    router.refresh();
  }

  return (
    <AuthContext.Provider value={{ user, organization, isLoading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
