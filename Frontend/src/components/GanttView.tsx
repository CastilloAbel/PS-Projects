import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  Plus,
  PanelRightOpen,
  PanelRightClose,
  RotateCcw,
  CheckCircle2,
  ListTodo,
  AlertCircle,
  Move
} from 'lucide-react';
import type { Board, Card, Tag, WorkspaceMember, BoardMember } from '../types';
import { updateCard, createCard, createList } from '../api';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useUser } from '../context/UserContext';
import { usePermission } from '../context/PermissionContext';
import { CardModal } from './CardModal';

// ==========================================
// DATE HELPERS (VANILLA JS)
// ==========================================
const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const getStartOfDay = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const differenceInDays = (d1: Date, d2: Date): number => {
  const s1 = getStartOfDay(d1).getTime();
  const s2 = getStartOfDay(d2).getTime();
  return Math.round((s1 - s2) / (1000 * 60 * 60 * 24));
};

const isSameDay = (d1: Date, d2: Date): boolean => {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

const getDaysInPeriod = (startDate: Date, numDays: number): Date[] => {
  const days: Date[] = [];
  for (let i = 0; i < numDays; i++) {
    days.push(addDays(startDate, i));
  }
  return days;
};

interface GanttViewProps {
  board: Board;
  workspaceTags?: Tag[];
  onBoardUpdate: () => void;
}

export const GanttView: React.FC<GanttViewProps> = ({
  board,
  workspaceTags = [],
  onBoardUpdate,
}) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { currentUserId } = useUser();
  const { canCreateCard, canEditCard } = usePermission();

  // Navigation & Scale State
  const [currentDate, setCurrentDate] = useState<Date>(() => getStartOfDay(new Date()));
  const [scale, setScale] = useState<'WEEK' | 'MONTH'>('WEEK');
  const [showUnscheduled, setShowUnscheduled] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Quick List Creation States
  const [showNewListModal, setShowNewListModal] = useState(false);
  const [newListName, setNewListName] = useState('');

  // Quick Card Creation States
  const [quickCreateListId, setQuickCreateListId] = useState<string | null>(null);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [newCardStartDate, setNewCardStartDate] = useState('');
  const [newCardDueDate, setNewCardDueDate] = useState('');

  // Drag & Resize Mouse Interaction State
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [dragType, setDragType] = useState<'MOVE' | 'RESIZE_START' | 'RESIZE_END' | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragDeltaDays, setDragDeltaDays] = useState(0);

  const gridScrollRef = useRef<HTMLDivElement>(null);

  // Timeline Range Math
  const daysCount = scale === 'WEEK' ? 14 : 30;
  const startOffsetOffset = scale === 'WEEK' ? -3 : -5;
  const timelineStart = useMemo(() => {
    return getStartOfDay(addDays(currentDate, startOffsetOffset));
  }, [currentDate, scale]);

  const timelineDays = useMemo(() => {
    return getDaysInPeriod(timelineStart, daysCount);
  }, [timelineStart, daysCount]);

  const columnWidth = scale === 'WEEK' ? 80 : 52;
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Month header spans calculation
  const monthSpans = useMemo(() => {
    const spans: { monthName: string; year: number; span: number }[] = [];
    if (timelineDays.length === 0) return spans;

    let currentSpan = 0;
    let currentMonth = timelineDays[0].getMonth();
    let currentYear = timelineDays[0].getFullYear();

    timelineDays.forEach((day, index) => {
      if (day.getMonth() === currentMonth && day.getFullYear() === currentYear) {
        currentSpan++;
      } else {
        spans.push({
          monthName: monthNames[currentMonth],
          year: currentYear,
          span: currentSpan,
        });
        currentSpan = 1;
        currentMonth = day.getMonth();
        currentYear = day.getFullYear();
      }

      if (index === timelineDays.length - 1) {
        spans.push({
          monthName: monthNames[currentMonth],
          year: currentYear,
          span: currentSpan,
        });
      }
    });

    return spans;
  }, [timelineDays]);

  // Extract scheduled and unscheduled cards
  const allCards = useMemo(() => {
    const cards: Card[] = [];
    board.lists.forEach((list) => {
      list.cards.forEach((card) => {
        cards.push(card);
      });
    });
    return cards;
  }, [board]);

  const getCardDates = (card: Card) => {
    let start = card.startDate ? new Date(card.startDate) : null;
    let due = card.dueDate ? new Date(card.dueDate) : null;
    if (start && !due) due = new Date(start);
    if (due && !start) start = new Date(due);
    return { start, due };
  };

  const scheduledCards = useMemo(() => {
    return allCards.filter((card) => card.startDate || card.dueDate);
  }, [allCards]);

  const unscheduledCards = useMemo(() => {
    return allCards.filter((card) => !card.startDate && !card.dueDate);
  }, [allCards]);

  // Drag & Stretch Drag event bindings
  useEffect(() => {
    if (!draggedCardId) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStartX;
      const daysShift = Math.round(deltaX / columnWidth);
      setDragDeltaDays(daysShift);
    };

    const handleMouseUp = async () => {
      if (draggedCardId && dragType && dragDeltaDays !== 0) {
        const card = allCards.find((c) => c.id === draggedCardId);
        if (card) {
          const { start, due } = getCardDates(card);
          if (start && due) {
            let newStart = new Date(start);
            let newDue = new Date(due);

            if (dragType === 'MOVE') {
              newStart = addDays(start, dragDeltaDays);
              newDue = addDays(due, dragDeltaDays);
            } else if (dragType === 'RESIZE_START') {
              newStart = addDays(start, dragDeltaDays);
              if (newStart > newDue) newStart = new Date(newDue);
            } else if (dragType === 'RESIZE_END') {
              newDue = addDays(due, dragDeltaDays);
              if (newDue < newStart) newDue = new Date(newStart);
            }

            try {
              setIsUpdating(true);
              await updateCard(card.id, {
                startDate: newStart.toISOString(),
                dueDate: newDue.toISOString(),
                userId: currentUserId,
              });
              onBoardUpdate();
            } catch (err) {
              console.error('Error updating card dates:', err);
            } finally {
              setIsUpdating(false);
            }
          }
        }
      }

      setDraggedCardId(null);
      setDragType(null);
      setDragDeltaDays(0);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggedCardId, dragType, dragStartX, dragDeltaDays, columnWidth, allCards, currentUserId, onBoardUpdate]);

  const handleDragStart = (e: React.MouseEvent, cardId: string, type: 'MOVE' | 'RESIZE_START' | 'RESIZE_END') => {
    if (!canEditCard) return;
    e.stopPropagation();
    e.preventDefault();
    setDraggedCardId(cardId);
    setDragType(type);
    setDragStartX(e.clientX);
    setDragDeltaDays(0);
  };

  const handleUpdateCard = async (cardId: string, updates: Partial<Card>) => {
    try {
      setIsUpdating(true);
      await updateCard(cardId, { ...updates, userId: currentUserId });
      onBoardUpdate();
      setEditingCard(null);
    } catch (err) {
      console.error('Error updating card detail:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleQuickScheduleToday = async (cardId: string) => {
    const today = getStartOfDay(new Date());
    const endOfDay = addDays(today, 1);
    try {
      setIsUpdating(true);
      await updateCard(cardId, {
        startDate: today.toISOString(),
        dueDate: endOfDay.toISOString(),
        userId: currentUserId,
      });
      onBoardUpdate();
    } catch (err) {
      console.error('Error quick scheduling card:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  // Quick List Creation Handler
  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;

    try {
      setIsUpdating(true);
      await createList(newListName, board.id, board.lists.length, currentUserId);
      onBoardUpdate();
      setShowNewListModal(false);
      setNewListName('');
    } catch (err) {
      console.error('Error creating list:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  // Quick Card Creation Handlers
  const handleCellClick = (listId: string, date: Date) => {
    if (!canCreateCard) return;
    setQuickCreateListId(listId);
    const dateStr = date.toISOString().split('T')[0];
    setNewCardStartDate(dateStr);
    setNewCardDueDate(dateStr);
  };

  const handleOpenQuickCreate = (listId: string) => {
    if (!canCreateCard) return;
    setQuickCreateListId(listId);
    const todayStr = new Date().toISOString().split('T')[0];
    setNewCardStartDate(todayStr);
    setNewCardDueDate(todayStr);
  };

  const handleCreateQuickCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardTitle.trim() || !quickCreateListId) return;

    try {
      setIsUpdating(true);
      const list = board.lists.find((l) => l.id === quickCreateListId);
      const order = list ? list.cards.length : 0;

      await createCard(
        newCardTitle,
        quickCreateListId,
        order,
        'MEDIUM',
        currentUserId,
        newCardStartDate ? new Date(newCardStartDate).toISOString() : null,
        newCardDueDate ? new Date(newCardDueDate).toISOString() : null
      );

      onBoardUpdate();
      setQuickCreateListId(null);
      setNewCardTitle('');
    } catch (err) {
      console.error('Error creating quick card:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  // Find today's vertical position
  const todayPosition = useMemo(() => {
    const today = getStartOfDay(new Date());
    const offset = differenceInDays(today, timelineStart);
    if (offset >= 0 && offset < daysCount) {
      return offset * columnWidth + (columnWidth / 2);
    }
    return null;
  }, [timelineStart, daysCount, columnWidth]);

  // CSS themes variables mapping
  const bgClass = theme === 'dark' ? 'bg-surface-950 text-surface-50' : 'bg-surface-50 text-surface-900';
  const headerBgClass = theme === 'dark' ? 'bg-surface-900 border-surface-800' : 'bg-white border-surface-200';
  const rowBorderClass = theme === 'dark' ? 'border-surface-800' : 'border-surface-200';
  const stickyPanelBg = theme === 'dark' ? 'bg-surface-900' : 'bg-white';
  const cellBgAlt = theme === 'dark' ? 'bg-surface-900/30' : 'bg-surface-100/40';

  return (
    <div className={`flex flex-col h-full overflow-hidden ${bgClass} transition-colors relative`}>
      {/* Gantt Header Toolbar */}
      <div className={`flex flex-wrap items-center justify-between gap-4 p-4 border-b ${headerBgClass} z-10 shadow-sm`}>
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-primary-500" />
          <h1 className="text-xl font-bold tracking-tight">Cronograma de Misiones</h1>
          {isUpdating && (
            <span className="text-xs text-primary-500 animate-pulse font-semibold bg-primary-500/10 px-2 py-0.5 rounded-full border border-primary-500/20">
              Guardando cambios...
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* New List button */}
          {canCreateCard && (
            <button
              onClick={() => setShowNewListModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-surface-300 dark:border-surface-700 hover:bg-surface-200 dark:hover:bg-surface-800 text-xs font-semibold transition-all"
            >
              <Plus className="w-4 h-4 text-primary-500" />
              <span>Nueva Lista</span>
            </button>
          )}

          {/* Prev/Today/Next controls */}
          <div className="flex items-center bg-surface-200 dark:bg-surface-800 rounded-lg p-0.5">
            <button
              onClick={() => setCurrentDate((prev) => addDays(prev, scale === 'WEEK' ? -7 : -15))}
              className="p-1.5 hover:bg-surface-300 dark:hover:bg-surface-700 rounded-md transition-colors"
              title="Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentDate(getStartOfDay(new Date()))}
              className="px-3 py-1.5 text-xs font-bold hover:bg-surface-300 dark:hover:bg-surface-700 rounded-md transition-colors uppercase tracking-wider"
            >
              Hoy
            </button>
            <button
              onClick={() => setCurrentDate((prev) => addDays(prev, scale === 'WEEK' ? 7 : 15))}
              className="p-1.5 hover:bg-surface-300 dark:hover:bg-surface-700 rounded-md transition-colors"
              title="Siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Scale selector */}
          <div className="flex items-center bg-surface-200 dark:bg-surface-800 rounded-lg p-0.5">
            <button
              onClick={() => setScale('WEEK')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                scale === 'WEEK'
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'hover:bg-surface-300 dark:hover:bg-surface-700 text-surface-600 dark:text-surface-300'
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => setScale('MONTH')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                scale === 'MONTH'
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'hover:bg-surface-300 dark:hover:bg-surface-700 text-surface-600 dark:text-surface-300'
              }`}
            >
              Mes
            </button>
          </div>

          {/* Unscheduled sidebar toggle button */}
          <button
            onClick={() => setShowUnscheduled(!showUnscheduled)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              showUnscheduled
                ? 'bg-primary-500/10 text-primary-400 border-primary-500/30'
                : 'hover:bg-surface-200 dark:hover:bg-surface-800 border-surface-300 dark:border-surface-700'
            }`}
          >
            <ListTodo className="w-4 h-4" />
            <span>Sin Programar ({unscheduledCards.length})</span>
            {showUnscheduled ? <PanelRightClose className="w-3.5 h-3.5 ml-1" /> : <PanelRightOpen className="w-3.5 h-3.5 ml-1" />}
          </button>
        </div>
      </div>

      {/* Gantt Chart Content Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 overflow-auto select-none" ref={gridScrollRef}>
          <div className="min-w-max flex flex-col relative py-4">
            
            {board.lists.length === 0 ? (
              /* Informative Empty State */
              <div className="flex flex-col items-center justify-center p-12 text-center max-w-md mx-auto my-12 bg-surface-900/40 border border-primary-500/10 rounded-2xl backdrop-blur-sm shadow-xl">
                <ListTodo className="w-12 h-12 text-primary-500/60 mb-4 animate-pulse" />
                <h3 className="text-lg font-bold text-surface-250 text-surface-200 mb-2">Este tablero no tiene listas</h3>
                <p className="text-xs text-surface-400 mb-6 leading-relaxed">
                  Para poder planificar tareas en el cronograma de Gantt, primero necesitas crear al menos una lista (por ejemplo: "Por hacer", "En progreso").
                </p>
                {canCreateCard && (
                  <button
                    onClick={() => setShowNewListModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-lg transition-all shadow-lg shadow-primary-500/20 hover:scale-[1.02]"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Crear Primera Lista</span>
                  </button>
                )}
              </div>
            ) : (
              /* Calendar timeline table layout */
              <table className="border-collapse table-fixed w-full relative">
                {/* Header: Months & Days */}
                <thead>
                  {/* Months Row */}
                  <tr className={`border-b ${rowBorderClass}`}>
                    <th className={`w-64 sticky left-0 z-20 ${stickyPanelBg} border-r ${rowBorderClass} p-2 text-left text-xs font-semibold uppercase tracking-wider text-surface-500`}>
                      Listas / Tareas
                    </th>
                    {monthSpans.map((ms, idx) => (
                      <th
                        key={idx}
                        colSpan={ms.span}
                        className={`p-2 border-r ${rowBorderClass} text-center text-xs font-bold text-primary-400 tracking-wide uppercase bg-surface-900/10 dark:bg-surface-900/20`}
                        style={{ width: `${ms.span * columnWidth}px` }}
                      >
                        {ms.monthName} {ms.year}
                      </th>
                    ))}
                  </tr>
                  {/* Days Row */}
                  <tr className={`border-b ${rowBorderClass} bg-surface-100/50 dark:bg-surface-900/30`}>
                    <th className={`w-64 sticky left-0 z-20 ${stickyPanelBg} border-r ${rowBorderClass}`}></th>
                    {timelineDays.map((day, idx) => {
                      const isToday = isSameDay(day, new Date());
                      const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                      return (
                        <th
                          key={idx}
                          className={`p-1 border-r ${rowBorderClass} text-center font-mono text-[11px] leading-tight select-none ${
                            isToday ? 'bg-primary-500/10 text-primary-400 font-bold' : isWeekend ? 'text-surface-400 dark:text-surface-500' : ''
                          }`}
                          style={{ width: `${columnWidth}px` }}
                        >
                          <div className="text-[9px] uppercase font-sans tracking-tight">
                            {day.toLocaleDateString('es', { weekday: 'narrow' })}
                          </div>
                          <div className={`mt-0.5 w-6 h-6 mx-auto flex items-center justify-center rounded-full ${
                            isToday ? 'bg-primary-500 text-white font-bold' : ''
                          }`}>
                            {day.getDate()}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                {/* Rows: Grouped by Lists */}
                <tbody className="relative">
                  {board.lists.map((list) => {
                    const listCards = list.cards.filter((card) => card.startDate || card.dueDate);
                    return (
                      <React.Fragment key={list.id}>
                        {/* List Header Row */}
                        <tr className={`border-b ${rowBorderClass} bg-surface-100/40 dark:bg-surface-900/50`}>
                          <td className={`w-64 sticky left-0 z-10 ${stickyPanelBg} border-r ${rowBorderClass} p-3 font-extrabold text-sm text-primary-500 uppercase tracking-wide flex items-center justify-between gap-2`}>
                            <div className="flex items-center gap-2 truncate">
                              <span className="w-1.5 h-3.5 bg-primary-500 rounded-sm" />
                              <span className="truncate">{list.name}</span>
                              <span className="text-xs font-normal text-surface-400 lowercase">
                                ({listCards.length})
                              </span>
                            </div>
                            {canCreateCard && (
                              <button
                                onClick={() => handleOpenQuickCreate(list.id)}
                                className="p-1 hover:bg-surface-200 dark:hover:bg-surface-800 rounded transition-colors text-surface-400 hover:text-primary-500 shrink-0"
                                title="Crear nueva misión"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                          {/* Empty spacing cells for timeline header row */}
                          {timelineDays.map((day, idx) => (
                            <td
                              key={idx}
                              onClick={() => handleCellClick(list.id, day)}
                              className={`border-r ${rowBorderClass} h-10 hover:bg-primary-500/10 cursor-pointer transition-colors`}
                            />
                          ))}
                        </tr>

                        {/* Cards Rows */}
                        {listCards.length > 0 ? (
                          listCards.map((card) => {
                            const { start, due } = getCardDates(card);
                            let left = 0;
                            let width = 0;
                            let isVisible = false;

                            // Compute visual boundaries
                            if (start && due) {
                              let tempStart = new Date(start);
                              let tempDue = new Date(due);

                              // Apply local drag overrides
                              if (card.id === draggedCardId) {
                                if (dragType === 'MOVE') {
                                  tempStart = addDays(tempStart, dragDeltaDays);
                                  tempDue = addDays(tempDue, dragDeltaDays);
                                } else if (dragType === 'RESIZE_START') {
                                  tempStart = addDays(tempStart, dragDeltaDays);
                                  if (tempStart > tempDue) tempStart = new Date(tempDue);
                                } else if (dragType === 'RESIZE_END') {
                                  tempDue = addDays(tempDue, dragDeltaDays);
                                  if (tempDue < tempStart) tempDue = new Date(tempStart);
                                }
                              }

                              const startOffset = differenceInDays(tempStart, timelineStart);
                              const duration = differenceInDays(tempDue, tempStart) + 1;

                              left = startOffset * columnWidth;
                              width = Math.max(1, duration) * columnWidth;

                              // Visible range check (with 1 day tolerance)
                              isVisible = (startOffset + duration > 0) && (startOffset < daysCount);
                            }

                            return (
                              <tr
                                key={card.id}
                                className={`border-b ${rowBorderClass} group hover:bg-surface-100/30 dark:hover:bg-surface-800/10 transition-colors`}
                              >
                                {/* Sticky task header */}
                                <td
                                  onClick={() => setEditingCard(card)}
                                  className={`w-64 sticky left-0 z-10 ${stickyPanelBg} border-r ${rowBorderClass} p-3 text-xs font-semibold hover:text-primary-500 cursor-pointer truncate max-w-xs shadow-[2px_0_5px_rgba(0,0,0,0.02)]`}
                                  title={card.title}
                                >
                                  <div className="flex flex-col gap-1">
                                    <span className="truncate">{card.title}</span>
                                    {card.assignee && (
                                      <span className="text-[10px] text-surface-400 font-normal">
                                        👤 {card.assignee.name}
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* Timeline cells & card horizontal plot bar */}
                                <td
                                  colSpan={daysCount}
                                  className="p-0 relative h-14 overflow-visible"
                                >
                                  {/* Alternating vertical grid cell lines */}
                                  <div className="absolute inset-0 flex">
                                    {timelineDays.map((day, idx) => {
                                      const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                                      return (
                                        <div
                                          key={idx}
                                          className={`border-r ${rowBorderClass} h-full select-none pointer-events-none ${
                                            isWeekend ? cellBgAlt : ''
                                          }`}
                                          style={{ width: `${columnWidth}px` }}
                                        />
                                      );
                                    })}
                                  </div>

                                  {/* Today Red vertical line marker */}
                                  {todayPosition !== null && (
                                    <div
                                      className="absolute top-0 bottom-0.5 w-0.5 bg-red-500 z-10 pointer-events-none"
                                      style={{ left: `${todayPosition}px` }}
                                    >
                                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 -ml-0.5 absolute -top-1" />
                                    </div>
                                  )}

                                  {/* Plotted Card Bar */}
                                  {isVisible && (
                                    <div
                                      style={{
                                        left: `${left}px`,
                                        width: `${width}px`,
                                      }}
                                      className={`absolute top-2.5 h-9 rounded-lg border shadow-sm flex items-center justify-between px-2 bg-gradient-to-r hover:shadow-md transition-all cursor-grab active:cursor-grabbing ${
                                        card.isCompleted
                                          ? 'from-green-500/20 to-green-600/10 border-green-500/30 text-green-400'
                                          : theme === 'dark'
                                          ? 'from-primary-950/40 to-primary-900/30 border-primary-500/30 text-surface-100'
                                          : 'from-primary-50 to-primary-100/50 border-primary-300 text-surface-800'
                                      } ${!canEditCard ? 'opacity-90 cursor-not-allowed' : ''}`}
                                      onMouseDown={(e) => handleDragStart(e, card.id, 'MOVE')}
                                      onClick={() => setEditingCard(card)}
                                    >
                                      {/* Left resize handle */}
                                      {canEditCard && (
                                        <div
                                          className="absolute left-0 top-0 bottom-0 w-2 hover:bg-primary-500/40 rounded-l-lg cursor-w-resize z-10"
                                          onMouseDown={(e) => handleDragStart(e, card.id, 'RESIZE_START')}
                                        />
                                      )}

                                      {/* Inner details container */}
                                      <div className="flex items-center gap-1.5 overflow-hidden w-full h-full select-none pointer-events-none">
                                        {canEditCard && <Move className="w-3 h-3 text-surface-400 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />}
                                        {card.isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />}
                                        <span className="text-[11px] font-bold truncate select-none leading-none">
                                          {card.title}
                                        </span>
                                      </div>

                                      {/* Right resize handle */}
                                      {canEditCard && (
                                        <div
                                          className="absolute right-0 top-0 bottom-0 w-2 hover:bg-primary-500/40 rounded-r-lg cursor-e-resize z-10"
                                          onMouseDown={(e) => handleDragStart(e, card.id, 'RESIZE_END')}
                                        />
                                      )}
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          // No cards scheduled row
                          <tr className={`border-b ${rowBorderClass}`}>
                            <td className={`w-64 sticky left-0 z-10 ${stickyPanelBg} border-r ${rowBorderClass} p-3 text-xs italic text-surface-400`}>
                              Sin misiones programadas
                            </td>
                            <td colSpan={daysCount} className="p-0 relative h-10">
                              <div className="absolute inset-0 flex">
                                {timelineDays.map((day, idx) => {
                                  const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                                  return (
                                    <div
                                      key={idx}
                                      onClick={() => handleCellClick(list.id, day)}
                                      className={`border-r ${rowBorderClass} h-full select-none hover:bg-primary-500/10 cursor-pointer transition-colors ${
                                        isWeekend ? cellBgAlt : ''
                                      }`}
                                      style={{ width: `${columnWidth}px` }}
                                    />
                                  );
                                })}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Unscheduled Cards Sidebar Drawer */}
        {showUnscheduled && (
          <aside className={`w-80 border-l ${headerBgClass} flex flex-col shrink-0 z-20 shadow-lg animate-in slide-in-from-right duration-250`}>
            <div className="p-4 border-b border-inherit flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary-500" />
                <h2 className="font-bold text-sm">Misiones sin Fecha</h2>
              </div>
              <button
                onClick={() => setShowUnscheduled(false)}
                className="p-1 hover:bg-surface-200 dark:hover:bg-surface-700 rounded-md transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {unscheduledCards.length > 0 ? (
                unscheduledCards.map((card) => (
                  <div
                    key={card.id}
                    className={`p-3 rounded-lg border flex flex-col gap-2 hover:border-primary-500 transition-colors shadow-sm bg-surface-100/40 dark:bg-surface-900/40 ${rowBorderClass}`}
                  >
                    <div className="flex justify-between items-start gap-1">
                      <span className="text-xs font-bold text-surface-200 truncate flex-1 leading-tight">
                        {card.title}
                      </span>
                      {card.priority && (
                        <span className="text-[9px] uppercase tracking-wider bg-surface-200 dark:bg-surface-800 text-surface-400 font-semibold px-1 rounded">
                          {card.priority}
                        </span>
                      )}
                    </div>

                    <div className="flex justify-between items-center mt-1">
                      <button
                        onClick={() => setEditingCard(card)}
                        className="text-[10px] text-surface-400 hover:text-primary-400 underline transition-colors"
                      >
                        Abrir detalles
                      </button>
                      {canEditCard && (
                        <button
                          onClick={() => handleQuickScheduleToday(card.id)}
                          className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-white bg-primary-500 hover:bg-primary-600 rounded-md transition-colors shadow-sm"
                        >
                          <Plus className="w-3 h-3" />
                          Programar Hoy
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 flex flex-col items-center gap-2 text-surface-400">
                  <AlertCircle className="w-6 h-6 text-surface-600" />
                  <p className="text-xs italic">Todas las misiones tienen fechas asignadas.</p>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Editing Card Modal */}
      {editingCard && (
        <CardModal
          card={editingCard}
          workspaceTags={workspaceTags}
          onClose={() => setEditingCard(null)}
          onSave={handleUpdateCard}
        />
      )}

      {/* Quick Create Card Modal Form */}
      {quickCreateListId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setQuickCreateListId(null)}>
          <div className={`rounded-lg shadow-lg p-6 w-full max-w-md border ${theme === 'dark' ? 'bg-surface-900 border-surface-700 text-surface-50' : 'bg-white border-surface-200 text-surface-900'}`} onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Nueva Misión</h3>
            <form onSubmit={handleCreateQuickCard} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-surface-400 mb-1">Título</label>
                <input
                  type="text"
                  required
                  value={newCardTitle}
                  onChange={e => setNewCardTitle(e.target.value)}
                  placeholder="Ej: Izar las velas"
                  className={`w-full px-4 py-2 rounded-lg border outline-none ${theme === 'dark' ? 'bg-surface-800 border-surface-700 text-surface-50 focus:border-primary-500' : 'bg-surface-50 border-surface-200 text-surface-900 focus:border-primary-500'}`}
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-surface-400 mb-1">Inicio</label>
                  <input
                    type="date"
                    value={newCardStartDate}
                    onChange={e => setNewCardStartDate(e.target.value)}
                    className={`w-full px-3 py-1.5 rounded-lg border outline-none ${theme === 'dark' ? 'bg-surface-800 border-surface-700 text-surface-50 focus:border-primary-500' : 'bg-surface-50 border-surface-200 text-surface-900 focus:border-primary-500'}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-surface-400 mb-1">Vencimiento</label>
                  <input
                    type="date"
                    value={newCardDueDate}
                    onChange={e => setNewCardDueDate(e.target.value)}
                    className={`w-full px-3 py-1.5 rounded-lg border outline-none ${theme === 'dark' ? 'bg-surface-800 border-surface-700 text-surface-50 focus:border-primary-500' : 'bg-surface-50 border-surface-200 text-surface-900 focus:border-primary-500'}`}
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setQuickCreateListId(null)}
                  className="flex-1 px-4 py-2 rounded-lg border border-surface-300 dark:border-surface-600 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-medium transition-colors"
                >
                  Crear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New List Modal Form */}
      {showNewListModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowNewListModal(false)}>
          <div className={`rounded-lg shadow-lg p-6 w-full max-w-md border ${theme === 'dark' ? 'bg-surface-900 border-surface-700 text-surface-50' : 'bg-white border-surface-200 text-surface-900'}`} onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Nueva Lista</h3>
            <form onSubmit={handleCreateList} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-surface-400 mb-1">Nombre de la Lista</label>
                <input
                  type="text"
                  required
                  value={newListName}
                  onChange={e => setNewListName(e.target.value)}
                  placeholder="Ej: Por Hacer"
                  className={`w-full px-4 py-2 rounded-lg border outline-none ${theme === 'dark' ? 'bg-surface-800 border-surface-700 text-surface-50 focus:border-primary-500' : 'bg-surface-50 border-surface-200 text-surface-900 focus:border-primary-500'}`}
                  autoFocus
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewListModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg border border-surface-300 dark:border-surface-600 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-medium transition-colors"
                >
                  Crear Lista
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
