import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import type { Board } from '../types';

interface EditBoardModalProps {
  isOpen: boolean;
  isLoading: boolean;
  board: Board;
  onSubmit: (updates: Partial<Board>) => Promise<void>;
  onClose: () => void;
}

export const EditBoardModal: React.FC<EditBoardModalProps> = ({
  isOpen,
  isLoading,
  board,
  onSubmit,
  onClose,
}) => {
  const { theme } = useTheme();
  const [name, setName] = useState('');
  const [background, setBackground] = useState('');
  const [type, setType] = useState('KANBAN');
  const [status, setStatus] = useState('CREADO');
  const [startDate, setStartDate] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (board) {
      setName(board.name);
      setBackground(board.background || '');
      setType(board.type || 'KANBAN');
      setStatus(board.status || 'CREADO');
      setStartDate(board.startDate ? board.startDate.split('T')[0] : '');
    }
  }, [board, isOpen]);

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
      await onSubmit({
        name,
        background: background || null,
        type: type as any,
        status: status as any,
        startDate: startDate ? startDate : null,
      });
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || 'Error al actualizar el board';
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`rounded-lg shadow-lg p-6 w-full max-w-md border max-h-[90vh] overflow-y-auto ${bgClass} ${theme === 'dark' ? 'border-surface-700' : 'border-surface-200'}`}>
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-xl font-bold ${textClass}`}>Editar Board</h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1 hover:bg-surface-200 dark:hover:bg-surface-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

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

          {/* Project Type Selection */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${labelClass}`}>
              Tipo de Proyecto
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border outline-none transition-colors ${inputClass}`}
              disabled={isLoading}
            >
              <option value="KANBAN">Tablero Kanban</option>
              <option value="GANTT">Diagrama de Gantt</option>
            </select>
          </div>

          {/* Project Status Selection */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${labelClass}`}>
              Estado del Proyecto
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border outline-none transition-colors ${inputClass}`}
              disabled={isLoading}
            >
              <option value="CREADO">Creado</option>
              <option value="EN_DESARROLLO">En Desarrollo</option>
              <option value="FINALIZADO">Finalizado</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${labelClass}`}>
              Fecha de Inicio (opcional)
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border outline-none transition-colors ${inputClass}`}
              disabled={isLoading}
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
              className="flex-1 px-4 py-2 rounded-lg border border-surface-300 dark:border-surface-600 hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-700 dark:text-surface-300 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
