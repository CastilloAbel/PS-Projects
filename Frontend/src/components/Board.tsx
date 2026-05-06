import React, { useState, useEffect } from 'react';
import type { Board as BoardType, Card as CardType } from '../types';
import { List } from './List';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Card } from './Card';
import { moveCard, createList, createCard } from '../api';
import { useTheme } from '../context/ThemeContext';
import { Plus, X } from 'lucide-react';

interface BoardProps {
  initialBoard: BoardType;
  onBoardUpdate: () => void;
}

export const Board: React.FC<BoardProps> = ({ initialBoard, onBoardUpdate }) => {
  const [board, setBoard] = useState<BoardType>(initialBoard);
  const [activeCard, setActiveCard] = useState<CardType | null>(null);
  const [showNewListInput, setShowNewListInput] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [cardInputs, setCardInputs] = useState<Record<string, boolean>>({});
  const [cardTitles, setCardTitles] = useState<Record<string, string>>({});
  const { theme } = useTheme();

  useEffect(() => {
    setBoard(initialBoard);
  }, [initialBoard]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const { data } = active;

    if (data.current?.type === 'Card') {
      setActiveCard(data.current.card);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveCard = active.data.current?.type === 'Card';
    const isOverCard = over.data.current?.type === 'Card';
    const isOverList = over.data.current?.type === 'List';

    if (!isActiveCard) return;

    if (isActiveCard && isOverCard) {
      setBoard((prevBoard) => {
        const activeListIndex = prevBoard.lists.findIndex((l) =>
          l.cards.some((c) => c.id === activeId)
        );
        const overListIndex = prevBoard.lists.findIndex((l) =>
          l.cards.some((c) => c.id === overId)
        );

        if (activeListIndex === -1 || overListIndex === -1) return prevBoard;

        const activeList = prevBoard.lists[activeListIndex];
        const overList = prevBoard.lists[overListIndex];

        const activeCardIndex = activeList.cards.findIndex((c) => c.id === activeId);
        const overCardIndex = overList.cards.findIndex((c) => c.id === overId);

        const newLists = [...prevBoard.lists];

        if (activeListIndex === overListIndex) {
          newLists[activeListIndex] = {
            ...activeList,
            cards: arrayMove(activeList.cards, activeCardIndex, overCardIndex),
          };
        } else {
          const activeCard = activeList.cards[activeCardIndex];

          newLists[activeListIndex] = {
            ...activeList,
            cards: activeList.cards.filter((c) => c.id !== activeId),
          };

          const newOverCards = [...overList.cards];
          newOverCards.splice(overCardIndex, 0, { ...activeCard, listId: overList.id });
          newLists[overListIndex] = {
            ...overList,
            cards: newOverCards,
          };
        }

        return { ...prevBoard, lists: newLists };
      });
    }

    if (isActiveCard && isOverList) {
      setBoard((prevBoard) => {
        const activeListIndex = prevBoard.lists.findIndex((l) =>
          l.cards.some((c) => c.id === activeId)
        );
        const overListIndex = prevBoard.lists.findIndex((l) => l.id === overId);

        if (activeListIndex === -1 || overListIndex === -1) return prevBoard;

        const activeList = prevBoard.lists[activeListIndex];
        const overList = prevBoard.lists[overListIndex];
        const activeCardIndex = activeList.cards.findIndex((c) => c.id === activeId);

        if (activeListIndex !== overListIndex) {
          const newLists = [...prevBoard.lists];
          const activeCard = activeList.cards[activeCardIndex];

          newLists[activeListIndex] = {
            ...activeList,
            cards: activeList.cards.filter((c) => c.id !== activeId),
          };

          newLists[overListIndex] = {
            ...overList,
            cards: [...overList.cards, { ...activeCard, listId: overList.id }],
          };
          return { ...prevBoard, lists: newLists };
        }
        return prevBoard;
      });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveCard(null);
    const { active } = event;

    const activeId = active.id as string;

    const list = board.lists.find(l => l.cards.some(c => c.id === activeId));
    if (list) {
      const cardIndex = list.cards.findIndex(c => c.id === activeId);
      try {
        await moveCard(activeId, list.id, cardIndex);
      } catch (error) {
        console.error("Failed to save move to backend", error);
      }
    }
  };

  const handleAddCard = async (listId: string) => {
    setCardInputs({ ...cardInputs, [listId]: true });
  };

  const handleSaveCard = async (listId: string) => {
    const title = cardTitles[listId];
    if (!title.trim()) return;

    try {
      const list = board.lists.find(l => l.id === listId);
      if (list) {
        await createCard(title, listId, list.cards.length);
        setCardTitles({ ...cardTitles, [listId]: '' });
        setCardInputs({ ...cardInputs, [listId]: false });
        onBoardUpdate();
      }
    } catch (error) {
      console.error("Error creating card:", error);
    }
  };

  const handleAddList = async () => {
    if (!newListName.trim()) return;

    try {
      await createList(newListName, board.id, board.lists.length);
      setNewListName('');
      setShowNewListInput(false);
      onBoardUpdate();
    } catch (error) {
      console.error("Error creating list:", error);
    }
  };

  const bgClass = theme === 'dark' ? 'bg-surface-900' : 'bg-gradient-to-br from-primary-50 to-surface-50';
  const textClass = theme === 'dark' ? 'text-surface-50' : 'text-surface-900';

  return (
    <div className={`flex flex-col h-full ${bgClass} p-6 overflow-hidden transition-colors`}>
      <div className={`mb-6 font-bold text-3xl ${textClass}`}>
        {board.name}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4 flex-1 items-start">
          {board.lists.map((list) => (
            <List 
              key={list.id} 
              list={list} 
              onAddCard={handleAddCard}
              isAddingCard={cardInputs[list.id]}
              cardTitle={cardTitles[list.id] || ''}
              onCardTitleChange={(title) => setCardTitles({ ...cardTitles, [list.id]: title })}
              onSaveCard={() => handleSaveCard(list.id)}
              onCancelCard={() => setCardInputs({ ...cardInputs, [list.id]: false })}
            />
          ))}

          {!showNewListInput ? (
            <button
              onClick={() => setShowNewListInput(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors flex-shrink-0 ${
                theme === 'dark'
                  ? 'bg-surface-800 hover:bg-surface-700 text-surface-200'
                  : 'bg-white hover:bg-surface-100 text-surface-700'
              }`}
            >
              <Plus size={18} />
              Agregar Lista
            </button>
          ) : (
            <div className={`flex flex-col gap-2 w-72 flex-shrink-0 p-3 rounded-lg ${
              theme === 'dark' ? 'bg-surface-800' : 'bg-white'
            }`}>
              <input
                autoFocus
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddList();
                  if (e.key === 'Escape') setShowNewListInput(false);
                }}
                placeholder="Nombre de la lista..."
                className={`w-full px-3 py-2 rounded border outline-none transition-colors ${
                  theme === 'dark'
                    ? 'bg-surface-700 border-surface-600 text-surface-50 placeholder-surface-400 focus:border-primary-500'
                    : 'bg-surface-50 border-surface-200 text-surface-900 placeholder-surface-400 focus:border-primary-500'
                }`}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddList}
                  className="btn-primary flex-1"
                >
                  Agregar
                </button>
                <button
                  onClick={() => setShowNewListInput(false)}
                  className="btn-secondary flex-1"
                >
                  <X size={16} className="mx-auto" />
                </button>
              </div>
            </div>
          )}
        </div>

        <DragOverlay>
          {activeCard ? <Card card={activeCard} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};
