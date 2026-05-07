import React from 'react';
import type { List as ListType } from '../types';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from './Card';
import { Plus, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ListProps {
  list: ListType;
  onAddCard: (listId: string) => void;
  isAddingCard: boolean;
  cardTitle: string;
  onCardTitleChange: (title: string) => void;
  onSaveCard: () => void;
  onCancelCard: () => void;
  onCardClick: (card: import('../types').Card) => void;
}

export const List: React.FC<ListProps> = ({
  list,
  onAddCard,
  isAddingCard,
  cardTitle,
  onCardTitleChange,
  onSaveCard,
  onCancelCard,
  onCardClick,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: list.id,
    data: {
      type: 'List',
      list,
    },
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  const { theme } = useTheme();
  const bgClass = theme === 'dark' ? 'bg-surface-800' : 'bg-surface-100';
  const textClass = theme === 'dark' ? 'text-surface-50' : 'text-surface-900';
  const borderClass = theme === 'dark' ? 'border-surface-700' : 'border-surface-200';

  if (isDragging) {
    return (
      <div 
        ref={setNodeRef} 
        style={style} 
        className={`${bgClass} opacity-50 rounded-lg w-72 flex-shrink-0 flex flex-col max-h-full border border-primary-500`}
      />
    );
  }

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`${bgClass} rounded-lg w-72 flex-shrink-0 flex flex-col max-h-full border ${borderClass} transition-colors`}
    >
      <div 
        {...attributes} 
        {...listeners} 
        className={`p-4 font-semibold ${textClass} flex justify-between items-center border-b ${borderClass} cursor-grab active:cursor-grabbing`}
      >
        <h2>{list.name}</h2>
        <span className={`text-xs px-2 py-1 rounded-full ${
          theme === 'dark'
            ? 'bg-surface-700 text-surface-400'
            : 'bg-surface-200 text-surface-600'
        }`}>
          {list.cards.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 min-h-[200px]">
        <SortableContext items={list.cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-3 min-h-[50px]">
            {list.cards.map((card) => (
              <Card key={card.id} card={card} onClick={() => onCardClick(card)} />
            ))}
          </div>
        </SortableContext>
      </div>

      <div className={`p-3 border-t ${borderClass}`}>
        {!isAddingCard ? (
          <button
            onClick={() => onAddCard(list.id)}
            className={`flex items-center gap-2 w-full px-3 py-2 rounded transition-colors text-sm font-medium ${
              theme === 'dark'
                ? 'hover:bg-surface-700 text-surface-400 hover:text-surface-300'
                : 'hover:bg-surface-200 text-surface-600 hover:text-surface-700'
            }`}
          >
            <Plus size={16} />
            Agregar tarjeta
          </button>
        ) : (
          <div className="flex flex-col gap-2">
            <input
              autoFocus
              type="text"
              value={cardTitle}
              onChange={(e) => onCardTitleChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSaveCard();
                if (e.key === 'Escape') onCancelCard();
              }}
              placeholder="Título de la tarjeta..."
              className={`w-full px-3 py-2 rounded border text-sm outline-none transition-colors ${
                theme === 'dark'
                  ? 'bg-surface-700 border-surface-600 text-surface-50 placeholder-surface-500 focus:border-primary-500'
                  : 'bg-white border-surface-200 text-surface-900 placeholder-surface-400 focus:border-primary-500'
              }`}
            />
            <div className="flex gap-2">
              <button
                onClick={onSaveCard}
                className="flex-1 btn-primary text-sm py-1"
              >
                Guardar
              </button>
              <button
                onClick={onCancelCard}
                className="flex-1 btn-secondary text-sm py-1"
              >
                <X size={14} className="mx-auto" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
