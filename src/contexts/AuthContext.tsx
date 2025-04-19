import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  isAdmin: boolean;
  login: (password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// The correct password - in a real app, this would be handled securely on the backend
const ADMIN_PASSWORD = 'ZeHwgEho6p6m6rw3rCif';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  useEffect(() => {
    // Check if there's a valid admin session in localStorage
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
  }, []);

  const login = (password: string): boolean => {
    if (password === ADMIN_PASSWORD) {
      setIsAdmin(true);
      // Set a 24-hour session
      const expiry = new Date().getTime() + (24 * 60 * 60 * 1000);
      localStorage.setItem('adminSession', JSON.stringify({ expiry }));
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAdmin(false);
    localStorage.removeItem('adminSession');
  };

  return (
    <AuthContext.Provider value={{ isAdmin, login, logout }}>
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