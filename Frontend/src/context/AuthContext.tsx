import React, { createContext, useContext, useState, type ReactNode, useEffect } from 'react';
import type { User } from '../types';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user has valid session on mount
  // Token is stored in httpOnly cookie, managed by browser automatically
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Try to verify token by making a request to a protected endpoint
        // If cookies contain valid token, request succeeds
        // For now, we'll just mark as loaded
        // In production, could make a GET /auth/me endpoint
        const storedUser = sessionStorage.getItem('authUser');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = (newUser: User) => {
    setUser(newUser);
    setIsAuthenticated(true);
    // Store user info in sessionStorage (cleared when browser closes)
    // Token is in httpOnly cookie managed by browser
    sessionStorage.setItem('authUser', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    sessionStorage.removeItem('authUser');
    // Token cookie will be cleared by backend on logout endpoint
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};
