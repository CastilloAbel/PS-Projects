import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface CreateBoardModalProps {
  isOpen: boolean;
  isLoading: boolean;
  workspaceName: string;
  onSubmit: (name: string, background?: string) => Promise<void>;
  onClose: () => void;
}

export const CreateBoardModal: React.FC<CreateBoardModalProps> = ({
  isOpen,
  isLoading,
  workspaceName,
  onSubmit,
  onClose,
}) => {
  const { theme } = useTheme();
  const [name, setName] = useState('');
  const [background, setBackground] = useState('');
  const [error, setError] = useState<string | null>(null);

  const backgroundOptions = [
    { label: 'Blue', value: '#3B82F6' },
    { label: 'Purple', value: '#8B5CF6' },
    { label: 'Pink', value: '#EC4899' },
    { label: 'Red', value: '#EF4444' },
    { label: 'Orange', value: '#F97316' },
    { label: 'Green', value: '#22C55E' },
    { label: 'Teal', value: '#14B8A6' },
    { label: 'Gray', value: '#6B7280' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('El nombre del board es requerido');
      return;
    }

    try {
      await onSubmit(name, background || undefined);
      setName('');
      setBackground('');
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || 'Error al crear el board';
      setError(errorMessage);
    }
  };

  if (!isOpen) return null;

  const bgClass = theme === 'dark' ? 'bg-surface-900' : 'bg-white';
  const textClass = theme === 'dark' ? 'text-surface-50' : 'text-surface-900';
  const labelClass = theme === 'dark' ? 'text-surface-400' : 'text-surface-500';
  const inputClass = theme === 'dark'
    ? 'bg-surface-800 border-surface-700 text-surface-50 placeholder-surface-500'
    : 'bg-surface-50 border-surface-200 text-surface-900 placeholder-surface-400';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`rounded-lg shadow-lg p-6 w-full max-w-md border ${bgClass} ${theme === 'dark' ? 'border-surface-700' : 'border-surface-200'}`}>
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-xl font-bold ${textClass}`}>Crear Board</h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1 hover:bg-surface-200 dark:hover:bg-surface-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workspace Info */}
        <p className={`text-sm mb-4 ${labelClass}`}>En: <span className="font-semibold">{workspaceName}</span></p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg text-red-700 dark:text-red-200 text-sm">
              {error}
            </div>
          )}

          {/* Name Field */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${labelClass}`}>
              Nombre del Board
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Mi Proyecto"
              className={`w-full px-4 py-2 rounded-lg border outline-none transition-colors ${inputClass}`}
              disabled={isLoading}
              autoFocus
            />
          </div>

          {/* Background Color Selection */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${labelClass}`}>
              Color de fondo (opcional)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {backgroundOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setBackground(option.value)}
                  className={`w-full aspect-square rounded-lg transition-all border-2 ${
                    background === option.value
                      ? 'border-primary-500 scale-110'
                      : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: option.value }}
                  title={option.label}
                  disabled={isLoading}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 rounded-lg border border-surface-300 dark:border-surface-600 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoading ? 'Creando...' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
