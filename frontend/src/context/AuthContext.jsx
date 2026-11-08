import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { adminApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('kamalig_admin_access_token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return null;
    }
    try {
      const profile = await adminApi.getMe();
      setUser(profile);
      return profile;
    } catch {
      localStorage.removeItem('kamalig_admin_access_token');
      localStorage.removeItem('kamalig_admin_refresh_token');
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (username, password) => {
    const res = await adminApi.login({ username, password });
    localStorage.setItem('kamalig_admin_access_token', res.access);
    localStorage.setItem('kamalig_admin_refresh_token', res.refresh);
    setUser(res.user);
    return res.user;
  };

  const logout = () => {
    localStorage.removeItem('kamalig_admin_access_token');
    localStorage.removeItem('kamalig_admin_refresh_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        refreshUser,
        isAuthenticated: Boolean(user),
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
