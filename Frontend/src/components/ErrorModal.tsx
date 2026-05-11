import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ErrorModalProps {
  error: string | null;
  onClose: () => void;
}

export const ErrorModal: React.FC<ErrorModalProps> = ({ error, onClose }) => {
  const { theme } = useTheme();

  if (!error) return null;

  const bgClass = theme === 'dark' ? 'bg-surface-800 border-surface-700' : 'bg-white border-surface-200';
  const textClass = theme === 'dark' ? 'text-surface-50' : 'text-surface-900';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className={`${bgClass} w-full max-w-md rounded-lg shadow-2xl border flex flex-col gap-4 p-6 animate-in fade-in zoom-in-95 duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <AlertCircle size={24} className="text-red-500 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h2 className={`text-lg font-bold ${textClass} mb-2`}>Error</h2>
            <p className={`text-sm ${theme === 'dark' ? 'text-surface-400' : 'text-surface-600'}`}>
              {error}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${
              theme === 'dark'
                ? 'hover:bg-surface-700 text-surface-400'
                : 'hover:bg-surface-100 text-surface-500'
            }`}
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg font-medium transition-colors bg-red-500 text-white hover:bg-red-600"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
