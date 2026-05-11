import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface ErrorContextType {
  error: string | null;
  setError: (error: string | null) => void;
  showError: (message: string) => void;
  clearError: () => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export const ErrorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [error, setError] = useState<string | null>(null);

  const showError = (message: string) => {
    setError(message);
    // Auto-clear después de 8 segundos si es muy largo, 5 si es corto
    const timeout = message.length > 100 ? 8000 : 5000;
    setTimeout(() => setError(null), timeout);
  };

  const clearError = () => setError(null);

  return (
    <ErrorContext.Provider value={{ error, setError, showError, clearError }}>
      {children}
    </ErrorContext.Provider>
  );
};

export const useError = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within ErrorProvider');
  }
  return context;
};
