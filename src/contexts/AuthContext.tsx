import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  isAdmin: boolean;
  login: (password: string) => boolean;
  logout: () => void;
  loading: boolean; // <-- Add this
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_PASSWORD = 'ZeHwgEho6p6m6rw3rCif';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true); // <-- Add this

  useEffect(() => {
    const adminSession = localStorage.getItem('adminSession');
    if (adminSession) {
      try {
        const { expiry } = JSON.parse(adminSession);
        if (new Date().getTime() < expiry) {
          setIsAdmin(true);
        } else {
          localStorage.removeItem('adminSession');
        }
      } catch (e) {
        localStorage.removeItem('adminSession');
      }
    }
    setLoading(false); // <-- Set loading to false after checking
  }, []);

  const login = (password: string): boolean => {
    if (password === ADMIN_PASSWORD) {
      setIsAdmin(true);
      const expiry = new Date().getTime() + (24 * 60 * 60 * 1000);
      localStorage.setItem('adminSession', JSON.stringify({ expiry }));
      window.location.reload();
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAdmin(false);
    localStorage.removeItem('adminSession');
  };

  return (
    <AuthContext.Provider value={{ isAdmin, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  // Always check localStorage for adminSession
  const adminSession = localStorage.getItem('adminSession');
  let isAdmin = context.isAdmin;
  if (adminSession) {
    try {
      const { expiry } = JSON.parse(adminSession);
      if (new Date().getTime() < expiry) {
        isAdmin = true;
      }
    } catch (e) {}
  }

  return { ...context, isAdmin };
}