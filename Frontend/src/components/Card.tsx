import React from 'react';
import { type Card as CardType, type Priority, MOCK_USERS } from '../types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Flag, Calendar, CheckCircle2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface CardProps {
  card: CardType;
  onClick?: () => void;
}

const priorityColors: Record<Priority, string> = {
  LOW: 'text-green-600 dark:text-green-400',
  MEDIUM: 'text-blue-600 dark:text-blue-400',
  HIGH: 'text-orange-600 dark:text-orange-400',
  URGENT: 'text-red-600 dark:text-red-400',
};

export const Card: React.FC<CardProps> = ({ card, onClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id, data: { type: 'Card', card } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const { theme } = useTheme();
  const bgClass = theme === 'dark' ? 'bg-surface-700 border-surface-600' : 'bg-white border-surface-200';
  const textClass = theme === 'dark' ? 'text-surface-50' : 'text-surface-900';
  const secondaryTextClass = theme === 'dark' ? 'text-surface-400' : 'text-surface-500';
  const hoverClass = theme === 'dark' ? 'hover:border-surface-500' : 'hover:border-surface-300';
  
  const assignee = card.assignee || MOCK_USERS.find(u => u.id === card.assigneeId);
  const isOverdue = card.dueDate && new Date(card.dueDate) < new Date() && !card.isCompleted;
  
  // Formato fecha para mostrar
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) return 'Hoy';
    if (date.toDateString() === tomorrow.toDateString()) return 'Mañana';
    return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onClick}
      className={`${bgClass} p-3 rounded-md shadow-sm border group flex flex-col gap-2 cursor-pointer transition-all ${hoverClass} ${
        isDragging ? 'ring-2 ring-primary-500 z-10 shadow-lg' : ''
      } ${card.isCompleted ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start gap-2">
        <div
          {...attributes}
          {...listeners}
          className={`mt-0.5 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity ${
            theme === 'dark' ? 'text-surface-500 hover:text-surface-400' : 'text-surface-300 hover:text-surface-600'
          }`}
        >
          <GripVertical size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-1">
            {card.isCompleted && (
              <CheckCircle2 size={14} className="mt-1 flex-shrink-0 text-green-500" />
            )}
            <p className={`text-sm font-medium ${textClass} ${card.isCompleted ? 'line-through' : ''}`}>
              {card.title}
            </p>
          </div>
          {card.description && (
            <p className={`text-xs mt-1 line-clamp-2 ${secondaryTextClass}`}>
              {card.description}
            </p>
          )}
        </div>
      </div>

      {/* Prioridad, Fechas, Tags */}
      <div className="flex flex-wrap gap-2 items-center">
        {card.priority && card.priority !== 'MEDIUM' && (
          <div className={`flex items-center gap-0.5 ${priorityColors[card.priority]}`} title={`Prioridad: ${card.priority}`}>
            <Flag size={12} />
          </div>
        )}

        {card.dueDate && (
          <div className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded ${
            isOverdue 
              ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200' 
              : 'bg-surface-100 text-surface-600 dark:bg-surface-600 dark:text-surface-300'
          }`} title={new Date(card.dueDate).toLocaleDateString()}>
            <Calendar size={12} />
            <span>{formatDate(card.dueDate)}</span>
          </div>
        )}

        {card.tags && card.tags.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {card.tags.slice(0, 2).map(cardTag => (
              <div
                key={cardTag.id}
                className="text-xs px-2 py-0.5 rounded font-semibold text-white"
                style={{ backgroundColor: cardTag.tag?.color || '#6B7280' }}
                title={cardTag.tag?.name}
              >
                {cardTag.tag?.name}
              </div>
            ))}
            {card.tags.length > 2 && (
              <span className={`text-xs px-2 py-0.5 ${secondaryTextClass}`}>
                +{card.tags.length - 2}
              </span>
            )}
          </div>
        )}
      </div>
      
      {assignee && (
        <div className="flex justify-end w-full">
          <div className="flex items-center gap-2" title={`Asignado a: ${assignee.name}`}>
            <img 
              src={assignee.avatarUrl} 
              alt={assignee.name} 
              className={`w-6 h-6 rounded-full border ${theme === 'dark' ? 'border-surface-600 bg-surface-800' : 'border-surface-200 bg-surface-100'}`} 
            />
          </div>
        </div>
      )}
    </div>
  );
};
