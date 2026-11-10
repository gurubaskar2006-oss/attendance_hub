import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { IUser, ITenant, ISoftwareLicense, UserRole } from '../types';

interface AuthContextType {
  user: IUser | null;
  tenant: ITenant | null;
  license: ISoftwareLicense | null;
  isLoading: boolean;
  login: (credentials: { email: string; password: string; schoolCode?: string }) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (roles: UserRole[]) => boolean;
  activeChildId: string | null;
  setActiveChildId: (id: string | null) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [tenant, setTenant] = useState<ITenant | null>(null);
  const [license, setLicense] = useState<ISoftwareLicense | null>(null);
  const [activeChildId, setActiveChildId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoading(false);
        return;
      }
      const res = await api.get('/auth/me');
      if (res.data.success) {
        setUser(res.data.data.user);
        setTenant(res.data.data.tenant);
        setLicense(res.data.data.license);
      }
    } catch (err) {
      localStorage.removeItem('token');
      setUser(null);
      setTenant(null);
      setLicense(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (credentials: { email: string; password: string; schoolCode?: string }) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/login', credentials);
      if (res.data.success) {
        const { token, user, tenant, license } = res.data.data;
        localStorage.setItem('token', token);
        setUser(user);
        setTenant(tenant);
        setLicense(license);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      // ignore
    } finally {
      localStorage.removeItem('token');
      setUser(null);
      setTenant(null);
      setLicense(null);
      setActiveChildId(null);
      window.location.href = '/login';
    }
  };

  const hasRole = (roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        tenant,
        license,
        isLoading,
        login,
        logout,
        hasRole,
        activeChildId,
        setActiveChildId,
        refreshUser: fetchCurrentUser,
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

