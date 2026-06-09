import React, { useState, useEffect } from 'react';
import type { Board as BoardType, Card as CardType, List as ListType, Tag } from '../types';
import { List } from './List';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates, SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { Card } from './Card';
import { CardModal } from './CardModal';
import { moveCard, createList, createCard, updateCard, getTags } from '../api';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useError } from '../context/ErrorContext';
import { useUser } from '../context/UserContext';
import { Plus, X } from 'lucide-react';

interface BoardProps {
  initialBoard: BoardType;
  onBoardUpdate: () => void;
}

export const Board: React.FC<BoardProps> = ({ initialBoard, onBoardUpdate }) => {
  const [board, setBoard] = useState<BoardType>(initialBoard);
  const [activeCard, setActiveCard] = useState<CardType | null>(null);
  const [activeList, setActiveList] = useState<ListType | null>(null);
  const [editingCard, setEditingCard] = useState<CardType | null>(null);
  const [showNewListInput, setShowNewListInput] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [cardInputs, setCardInputs] = useState<Record<string, boolean>>({});
  const [cardTitles, setCardTitles] = useState<Record<string, string>>({});
  const [workspaceTags, setWorkspaceTags] = useState<Tag[]>([]);
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { showError } = useError();
  const { currentUserId } = useUser();

  useEffect(() => {
    setBoard(initialBoard);
    // Cargar tags del workspace
    loadWorkspaceTags();
  }, [initialBoard]);

  const loadWorkspaceTags = async () => {
    try {
      if (initialBoard.workspaceId && initialBoard.workspaceId !== 'mock-workspace') {
        const tags = await getTags(initialBoard.workspaceId);
        setWorkspaceTags(tags);
      }
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  };

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
    } else if (data.current?.type === 'List') {
      setActiveList(data.current.list);
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
    setActiveList(null);
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const isActiveList = active.data.current?.type === 'List';

    if (isActiveList && activeId !== overId) {
      setBoard((prevBoard) => {
        const activeListIndex = prevBoard.lists.findIndex((l) => l.id === activeId);
        const overListIndex = prevBoard.lists.findIndex((l) => l.id === overId);

        if (activeListIndex !== -1 && overListIndex !== -1) {
          const newLists = arrayMove(prevBoard.lists, activeListIndex, overListIndex);
          return { ...prevBoard, lists: newLists };
        }
        return prevBoard;
      });
      // In the future: Add API call to update list order here
      return;
    }

    const list = board.lists.find(l => l.cards.some(c => c.id === activeId));
    if (list && active.data.current?.type === 'Card') {
      const cardIndex = list.cards.findIndex(c => c.id === activeId);
      try {
        if (board.id !== 'mock-board') {
          await moveCard(activeId, list.id, cardIndex);
        }
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
    if (!title?.trim()) return;

    const list = board.lists.find(l => l.id === listId);
    if (!list) return;

    // Optimistic local update
    const newCard = {
      id: `temp-card-${Date.now()}`,
      title,
      description: null,
      order: list.cards.length,
      listId
    };

    setBoard(prev => ({
      ...prev,
      lists: prev.lists.map(l => 
        l.id === listId 
          ? { ...l, cards: [...l.cards, newCard] } 
          : l
      )
    }));

    setCardTitles({ ...cardTitles, [listId]: '' });
    setCardInputs({ ...cardInputs, [listId]: false });

    try {
      if (board.id !== 'mock-board') {
        await createCard(title, listId, list.cards.length, undefined, currentUserId);
        onBoardUpdate();
      }
    } catch (error: any) {
      console.error("Error creating card:", error);
      const errorMessage = error?.response?.data?.error || 'No se pudo crear la tarjeta. Por favor intenta de nuevo.';
      showError(errorMessage);
      
      // Revert optimistic update
      setBoard(prev => ({
        ...prev,
        lists: prev.lists.map(l => 
          l.id === listId 
            ? { ...l, cards: l.cards.filter(c => c.id !== newCard.id) } 
            : l
        )
      }));
    }
  };

  const handleAddList = async () => {
    if (!newListName.trim()) return;

    // Optimistic local update
    const newList = {
      id: `temp-list-${Date.now()}`,
      name: newListName,
      order: board.lists.length,
      boardId: board.id,
      cards: []
    };

    setBoard(prev => ({
      ...prev,
      lists: [...prev.lists, newList]
    }));

    setNewListName('');
    setShowNewListInput(false);

    try {
      if (board.id !== 'mock-board') {
        await createList(newListName, board.id, board.lists.length, currentUserId);
        onBoardUpdate();
      }
    } catch (error: any) {
      console.error("Error creating list:", error);
      const errorMessage = error?.response?.data?.error || 'No se pudo crear la lista. Por favor intenta de nuevo.';
      showError(errorMessage);
      
      // Revert optimistic update
      setBoard(prev => ({
        ...prev,
        lists: prev.lists.filter(l => l.id !== newList.id)
      }));
    }
  };

  const handleUpdateCard = async (cardId: string, updates: Partial<CardType>) => {
    // Optimistic UI update
    setBoard((prev) => ({
      ...prev,
      lists: prev.lists.map((list) => ({
        ...list,
        cards: list.cards.map((c) => (c.id === cardId ? { ...c, ...updates } : c)),
      })),
    }));

    try {
      if (board.id !== 'mock-board') {
        await updateCard(cardId, { ...updates, userId: currentUserId });
        onBoardUpdate();
      }
    } catch (error: any) {
      console.error("Error updating card:", error);
      const errorMessage = error?.response?.data?.error || 'No se pudo actualizar la tarjeta. Por favor intenta de nuevo.';
      showError(errorMessage);
    }
  };

  const bgClass = theme === 'dark' ? 'bg-surface-900' : 'bg-gradient-to-br from-primary-50 to-surface-50';
  const textClass = theme === 'dark' ? 'text-surface-50' : 'text-surface-900';

  if (board.type === 'GANTT') {
    return (
      <div className={`flex flex-col h-full ${bgClass} p-6 sm:p-8 overflow-hidden items-center justify-center text-center transition-colors`}>
        <div className="max-w-2xl w-full p-8 rounded-2xl bg-surface-950/60 dark:bg-surface-900/40 border border-primary-500/20 backdrop-blur-md shadow-xl flex flex-col items-center">
          {/* Mock Gantt UI Graphics */}
          <div className="w-full flex flex-col gap-3 mb-8 bg-surface-950 p-4 rounded-xl border border-surface-800 text-left font-mono text-xs text-surface-400 select-none">
            <div className="flex justify-between border-b border-surface-800 pb-2 text-[10px] uppercase text-surface-500">
              <span className="w-1/4">Tarea</span>
              <span className="w-1/4">Junio 01 - 07</span>
              <span className="w-1/4">Junio 08 - 14</span>
              <span className="w-1/4">Junio 15 - 21</span>
            </div>
            <div className="flex items-center">
              <span className="w-1/4 truncate text-surface-200">🚢 Diseño del Barco</span>
              <div className="w-3/4 bg-surface-900 h-4 rounded overflow-hidden relative">
                <div className="absolute left-[5%] w-[45%] h-full bg-gradient-to-r from-primary-600 to-primary-400 rounded-sm animate-pulse" />
              </div>
            </div>
            <div className="flex items-center">
              <span className="w-1/4 truncate text-surface-200">⚔️ Compilación de Armas</span>
              <div className="w-3/4 bg-surface-900 h-4 rounded overflow-hidden relative">
                <div className="absolute left-[35%] w-[35%] h-full bg-gradient-to-r from-primary-500 to-primary-300 rounded-sm animate-pulse delay-75" />
              </div>
            </div>
            <div className="flex items-center">
              <span className="w-1/4 truncate text-surface-200">🗺️ Mapa del Tesoro</span>
              <div className="w-3/4 bg-surface-900 h-4 rounded overflow-hidden relative">
                <div className="absolute left-[60%] w-[25%] h-full bg-gradient-to-r from-primary-700 to-primary-500 rounded-sm animate-pulse delay-150" />
              </div>
            </div>
          </div>

          {/* Heading */}
          <h2 className="text-3xl font-extrabold text-white mb-3 tracking-tight">
            Diagrama de Gantt
          </h2>
          <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-primary-500/10 text-primary-400 rounded-full border border-primary-500/20 mb-6">
            En Desarrollo
          </span>
          <p className="text-surface-300 max-w-md text-base leading-relaxed mb-8">
            El timón se está ajustando y los mapas se están trazando. Muy pronto podrás gestionar tus proyectos con cronogramas interactivos, dependencias de tareas e hitos claves.
          </p>

          <div className="flex gap-4">
            <div className="flex items-center gap-2 text-sm text-surface-400">
              <span className="w-2.5 h-2.5 rounded-full bg-primary-400" />
              Cronogramas
            </div>
            <div className="flex items-center gap-2 text-sm text-surface-400">
              <span className="w-2.5 h-2.5 rounded-full bg-primary-500" />
              Dependencias
            </div>
            <div className="flex items-center gap-2 text-sm text-surface-400">
              <span className="w-2.5 h-2.5 rounded-full bg-primary-600" />
              Hitos
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${bgClass} p-4 sm:p-6 overflow-hidden transition-colors`}>
      <div className={`mb-4 sm:mb-6 font-bold text-2xl sm:text-3xl ${textClass}`}>
        {board.name}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-col md:flex-row gap-4 overflow-y-auto md:overflow-x-auto pb-4 flex-1 md:items-start h-full">
          <SortableContext items={board.lists.map(l => l.id)} strategy={horizontalListSortingStrategy}>
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
                onCardClick={setEditingCard}
              />
            ))}
          </SortableContext>

          {!showNewListInput ? (
            <button
              onClick={() => setShowNewListInput(true)}
              className={`flex items-center gap-2 px-4 py-3 md:py-2 rounded-lg font-medium transition-colors flex-shrink-0 w-full md:w-72 justify-center md:justify-start ${
                theme === 'dark'
                  ? 'bg-surface-800 hover:bg-surface-700 text-surface-200'
                  : 'bg-white hover:bg-surface-100 text-surface-700'
              }`}
            >
              <Plus size={18} />
              {t('addList')}
            </button>
          ) : (
            <div className={`flex flex-col gap-2 w-full md:w-72 flex-shrink-0 p-3 rounded-lg ${
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
                placeholder={t('listNamePlaceholder')}
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
                  {t('add')}
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
          {activeList ? (
            <List 
              list={activeList} 
              onAddCard={() => {}}
              isAddingCard={false}
              cardTitle=""
              onCardTitleChange={() => {}}
              onSaveCard={() => {}}
              onCancelCard={() => {}}
              onCardClick={() => {}}
            />
          ) : activeCard ? (
            <Card card={activeCard} />
          ) : null}
        </DragOverlay>
      </DndContext>

      {editingCard && (
        <CardModal
          card={editingCard}
          workspaceTags={workspaceTags}
          onClose={() => setEditingCard(null)}
          onSave={handleUpdateCard}
        />
      )}
    </div>
  );
};
