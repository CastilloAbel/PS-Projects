import React, { useState } from 'react';
import { X, AlignLeft, UserCircle2 } from 'lucide-react';
import { type Card, MOCK_USERS } from '../types';
import { useTheme } from '../context/ThemeContext';

interface CardModalProps {
  card: Card;
  onClose: () => void;
  onSave: (cardId: string, updates: Partial<Card>) => void;
}

export const CardModal: React.FC<CardModalProps> = ({ card, onClose, onSave }) => {
  const { theme } = useTheme();
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || '');
  const [assigneeId, setAssigneeId] = useState(card.assigneeId || '');

  const handleSave = () => {
    if (!title.trim()) return;
    onSave(card.id, {
      title,
      description: description || null,
      assigneeId: assigneeId || undefined,
    });
    onClose();
  };

  const bgClass = theme === 'dark' ? 'bg-surface-800 border-surface-700' : 'bg-white border-surface-200';
  const textClass = theme === 'dark' ? 'text-surface-50' : 'text-surface-900';
  const labelClass = theme === 'dark' ? 'text-surface-400' : 'text-surface-500';
  const inputClass = theme === 'dark' 
    ? 'bg-surface-900 border-surface-700 text-surface-50 focus:border-primary-500' 
    : 'bg-surface-50 border-surface-200 text-surface-900 focus:border-primary-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div 
        className={`${bgClass} w-full max-w-2xl rounded-xl shadow-2xl border flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-inherit">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={`text-2xl font-bold bg-transparent outline-none w-full ${textClass} focus:underline decoration-primary-500 underline-offset-4`}
            placeholder="Título de la tarea"
          />
          <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors">
            <X size={24} className={labelClass} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6 flex-1 overflow-y-auto">
          {/* Asignar Usuario */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <UserCircle2 size={18} className={labelClass} />
              <label className={`font-semibold ${textClass}`}>Asignar a</label>
            </div>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className={`w-full p-3 rounded-lg border outline-none transition-colors ${inputClass}`}
            >
              <option value="">Sin asignar</option>
              {MOCK_USERS.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
          </div>

          {/* Descripción */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlignLeft size={18} className={labelClass} />
              <label className={`font-semibold ${textClass}`}>Descripción</label>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Añade una descripción más detallada..."
              className={`w-full p-3 rounded-lg border outline-none transition-colors resize-none min-h-[150px] ${inputClass}`}
            />
          </div>
        </div>

        <div className="p-6 border-t border-inherit bg-surface-50 dark:bg-surface-900/50 flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">
            Cancelar
          </button>
          <button onClick={handleSave} className="btn-primary">
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
};
