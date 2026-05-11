import React, { createContext, useContext, useState, type ReactNode, useEffect } from 'react';
import type { User } from '../types';

interface UserContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  currentUserId: string;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Default user for demo purposes
const DEFAULT_USER_ID = 'user-1';

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>(DEFAULT_USER_ID);

  // Initialize from localStorage if available
  useEffect(() => {
    const storedUserId = localStorage.getItem('currentUserId');
    if (storedUserId) {
      setCurrentUserId(storedUserId);
    }
  }, []);

  // Save userId to localStorage when it changes
  const handleSetCurrentUser = (user: User | null) => {
    setCurrentUser(user);
    if (user?.id) {
      setCurrentUserId(user.id);
      localStorage.setItem('currentUserId', user.id);
    }
  };

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser: handleSetCurrentUser, currentUserId }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser debe usarse dentro de UserProvider');
  }
  return context;
};
