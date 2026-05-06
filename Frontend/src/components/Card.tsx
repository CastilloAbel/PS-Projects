import React from 'react';
import type { Card as CardType } from '../types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface CardProps {
  card: CardType;
}

export const Card: React.FC<CardProps> = ({ card }) => {
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
  const hoverClass = theme === 'dark' ? 'hover:border-surface-500' : 'hover:border-surface-300';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${bgClass} p-3 rounded-md shadow-sm border group flex items-start gap-2 cursor-pointer transition-all ${hoverClass} ${
        isDragging ? 'ring-2 ring-primary-500 z-10 shadow-lg' : ''
      }`}
    >
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
        <p className={`text-sm font-medium ${textClass}`}>{card.title}</p>
        {card.description && (
          <p className={`text-xs mt-1 line-clamp-2 ${
            theme === 'dark' ? 'text-surface-400' : 'text-surface-500'
          }`}>
            {card.description}
          </p>
        )}
      </div>
    </div>
  );
};
