import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('interncert_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('interncert_token') || null);
  const [loading, setLoading] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await api.login(email, password);
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('interncert_user', JSON.stringify(data.user));
      localStorage.setItem('interncert_token', data.token);
      setAuthModalOpen(false);
      return data.user;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const data = await api.register(userData);
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('interncert_user', JSON.stringify(data.user));
      localStorage.setItem('interncert_token', data.token);
      setAuthModalOpen(false);
      return data.user;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('interncert_user');
    localStorage.removeItem('interncert_token');
  };

  const openAuth = (mode = 'login') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      authModalOpen,
      authMode,
      setAuthModalOpen,
      setAuthMode,
      login,
      register,
      logout,
      openAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
