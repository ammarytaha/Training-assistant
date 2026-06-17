import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, ask the server who we are (validates the httpOnly cookie).
  const refresh = useCallback(async () => {
    try {
      const data = await api.get('/auth/me');
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = async (email, password, remember) => {
    const data = await api.post('/auth/login', { email, password, remember });
    setUser(data.user);
    return data.user;
  };

  const register = async (name, email, password, role) => {
    const data = await api.post('/auth/register', { name, email, password, role });
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    await api.post('/auth/logout');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
