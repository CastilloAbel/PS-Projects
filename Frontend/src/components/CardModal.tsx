import React, { useState } from 'react';
import { X, AlignLeft, UserCircle2, Flag, Calendar, Tag as TagIcon, MessageCircle, Activity, Lock, AlertCircle } from 'lucide-react';
import { type Card, type Priority, type Tag, MOCK_USERS } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { usePermission } from '../context/PermissionContext';

interface CardModalProps {
  card: Card;
  workspaceTags?: Tag[];
  onClose: () => void;
  onSave: (cardId: string, updates: Partial<Card>) => void;
}

const priorityColors: Record<Priority, string> = {
  LOW: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  MEDIUM: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  HIGH: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  URGENT: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

const priorityIcons: Record<Priority, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  URGENT: 4,
};

export const CardModal: React.FC<CardModalProps> = ({ card, workspaceTags = [], onClose, onSave }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { canEditCard, boardRole } = usePermission();
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || '');
  const [assigneeId, setAssigneeId] = useState(card.assigneeId || '');
  const [priority, setPriority] = useState<Priority>(card.priority || 'MEDIUM');
  const [startDate, setStartDate] = useState(card.startDate ? card.startDate.split('T')[0] : '');
  const [dueDate, setDueDate] = useState(card.dueDate ? card.dueDate.split('T')[0] : '');
  const [isCompleted, setIsCompleted] = useState(card.isCompleted || false);
  const [selectedTags, setSelectedTags] = useState<string[]>(card.tags?.map(ct => ct.tag?.id || ct.tagId) || []);
  const [activeTab, setActiveTab] = useState<'details' | 'activity'>('details');

  const handleSave = () => {
    if (!title.trim()) return;
    onSave(card.id, {
      title,
      description: description || null,
      assigneeId,
      priority,
      startDate: startDate || null,
      dueDate: dueDate || null,
      isCompleted,
    });
    onClose();
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  const bgClass = theme === 'dark' ? 'bg-surface-800 border-surface-700' : 'bg-white border-surface-200';
  const textClass = theme === 'dark' ? 'text-surface-50' : 'text-surface-900';
  const labelClass = theme === 'dark' ? 'text-surface-400' : 'text-surface-500';
  const inputClass = theme === 'dark' 
    ? 'bg-surface-900 border-surface-700 text-surface-50 focus:border-primary-500' 
    : 'bg-surface-50 border-surface-200 text-surface-900 focus:border-primary-500';
  const tabActiveClass = theme === 'dark' 
    ? 'text-primary-400 border-primary-500 border-b-2' 
    : 'text-primary-600 border-primary-600 border-b-2';

  const assignedUser = MOCK_USERS.find(u => u.id === assigneeId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div 
        className={`${bgClass} w-full max-w-3xl max-h-[95vh] sm:max-h-[90vh] rounded-xl shadow-2xl border flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start sm:items-center p-4 sm:p-6 border-b border-inherit gap-2">
           <input
                     type="text"
                     value={title}
                     onChange={(e) => setTitle(e.target.value)}
                     disabled={!canEditCard}
                     className={`text-lg sm:text-2xl font-bold bg-transparent outline-none w-full ${textClass} focus:underline decoration-primary-500 underline-offset-4 leading-tight ${!canEditCard ? 'opacity-60 cursor-not-allowed' : ''}`}
                     placeholder={t('taskTitle')}
                   />
          <button onClick={onClose} className="p-1 sm:p-2 rounded-full hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors shrink-0">
            <X size={20} className={`sm:w-6 sm:h-6 ${labelClass}`} />
          </button>
        </div>

        {/* Permission Restriction Alert */}
        {!canEditCard && (
          <div className="px-4 sm:px-6 py-3 bg-yellow-50 dark:bg-yellow-950 border-b border-yellow-200 dark:border-yellow-800 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                Limited Permissions
              </p>
              <p className="text-xs text-yellow-800 dark:text-yellow-200">
                {boardRole === 'VIEWER' && 'You can only view this card. Contact a board member to make changes.'}
                {boardRole === 'COMMENTER' && 'You can view and comment, but cannot edit this card.'}
                {boardRole === 'EDITOR' && 'As an Editor, you can only edit cards assigned to you.'}
              </p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className={`flex border-b ${theme === 'dark' ? 'border-surface-700' : 'border-surface-200'}`}>
          <button 
            onClick={() => setActiveTab('details')}
            className={`flex-1 py-2 sm:py-3 text-center text-sm sm:text-base font-medium transition-colors ${activeTab === 'details' ? tabActiveClass : labelClass}`}
          >
            Detalles
          </button>
          <button 
            onClick={() => setActiveTab('activity')}
            className={`flex-1 py-2 sm:py-3 text-center text-sm sm:text-base font-medium transition-colors flex items-center justify-center gap-1 ${activeTab === 'activity' ? tabActiveClass : labelClass}`}
          >
            <Activity size={16} /> Actividad
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 flex flex-col gap-4 sm:gap-6 flex-1 overflow-y-auto">
          {activeTab === 'details' ? (
            <>
              {/* Prioridad */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Flag size={16} className={`sm:w-[18px] sm:h-[18px] ${labelClass}`} />
                  <label className={`text-sm sm:text-base font-semibold ${textClass}`}>Prioridad</label>
                </div>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className={`w-full p-2 sm:p-3 text-sm sm:text-base rounded-lg border outline-none transition-colors ${inputClass}`}
                >
                  <option value="LOW">Baja</option>
                  <option value="MEDIUM">Media</option>
                  <option value="HIGH">Alta</option>
                  <option value="URGENT">Urgente</option>
                </select>
                {priority && (
                  <div className={`mt-2 px-2 py-1 rounded text-xs font-semibold inline-block ${priorityColors[priority]}`}>
                    {'🚩'.repeat(priorityIcons[priority])} {priority}
                  </div>
                )}
              </div>

              {/* Fechas */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar size={16} className={`sm:w-[18px] sm:h-[18px] ${labelClass}`} />
                    <label className={`text-sm sm:text-base font-semibold ${textClass}`}>Inicio</label>
                  </div>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={`w-full p-2 sm:p-3 text-sm sm:text-base rounded-lg border outline-none transition-colors ${inputClass}`}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar size={16} className={`sm:w-[18px] sm:h-[18px] ${labelClass}`} />
                    <label className={`text-sm sm:text-base font-semibold ${textClass}`}>Vencimiento</label>
                  </div>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className={`w-full p-2 sm:p-3 text-sm sm:text-base rounded-lg border outline-none transition-colors ${inputClass}`}
                  />
                </div>
              </div>

              {/* Completado */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="completed"
                  checked={isCompleted}
                  onChange={(e) => setIsCompleted(e.target.checked)}
                  className="w-4 h-4 rounded cursor-pointer"
                />
                <label htmlFor="completed" className={`text-sm sm:text-base font-semibold cursor-pointer ${textClass}`}>
                  Marcar como completada
                </label>
              </div>

              {/* Asignar Usuario */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <UserCircle2 size={16} className={`sm:w-[18px] sm:h-[18px] ${labelClass}`} />
                  <label className={`text-sm sm:text-base font-semibold ${textClass}`}>Asignar a</label>
                </div>
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className={`w-full p-2 sm:p-3 text-sm sm:text-base rounded-lg border outline-none transition-colors ${inputClass}`}
                >
                  <option value="">Sin asignar</option>
                  {MOCK_USERS.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
                {assignedUser && (
                  <div className={`mt-2 p-2 rounded flex items-center gap-2 ${theme === 'dark' ? 'bg-surface-700' : 'bg-surface-100'}`}>
                    {assignedUser.avatarUrl && (
                      <img src={assignedUser.avatarUrl} alt={assignedUser.name} className="w-6 h-6 rounded-full" />
                    )}
                    <span className={`text-sm ${textClass}`}>{assignedUser.name}</span>
                  </div>
                )}
              </div>

              {/* Tags */}
              {workspaceTags.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <TagIcon size={16} className={`sm:w-[18px] sm:h-[18px] ${labelClass}`} />
                    <label className={`text-sm sm:text-base font-semibold ${textClass}`}>Etiquetas</label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {workspaceTags.map(tag => (
                      <button
                        key={tag.id}
                        onClick={() => toggleTag(tag.id)}
                        className={`px-3 py-1 rounded-full text-xs sm:text-sm font-semibold transition-opacity ${
                          selectedTags.includes(tag.id) ? 'opacity-100' : 'opacity-50'
                        }`}
                        style={{
                          backgroundColor: tag.color,
                          color: '#fff'
                        }}
                      >
                        {tag.name} {selectedTags.includes(tag.id) && '✓'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Descripción */}
              <div className="flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  <AlignLeft size={16} className={`sm:w-[18px] sm:h-[18px] ${labelClass}`} />
                  <label className={`text-sm sm:text-base font-semibold ${textClass}`}>Descripción</label>
                </div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Agrega una descripción detallada..."
                  className={`w-full p-2 sm:p-3 text-sm sm:text-base rounded-lg border outline-none transition-colors resize-none flex-1 min-h-[100px] sm:min-h-[120px] ${inputClass}`}
                />
              </div>
            </>
          ) : (
            <>
              {/* Activity Timeline */}
              <div className="space-y-3">
                {card.activities && card.activities.length > 0 ? (
                  card.activities.map((activity, index) => (
                    <div key={index} className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-surface-700/50' : 'bg-surface-100'}`}>
                      <div className="flex items-start gap-2">
                        {activity.user?.avatarUrl && (
                          <img src={activity.user.avatarUrl} alt={activity.user.name} className="w-6 h-6 rounded-full" />
                        )}
                        <div className="flex-1">
                          <p className={`text-xs sm:text-sm font-semibold ${textClass}`}>
                            {activity.user?.name} • {new Date(activity.createdAt).toLocaleDateString()}
                          </p>
                          <p className={`text-xs sm:text-sm ${labelClass}`}>{activity.description}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className={`text-sm ${labelClass}`}>Sin actividad registrada</p>
                )}
              </div>

              {/* Comments */}
              <div className="border-t pt-4 sm:pt-6">
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <MessageCircle size={16} className={`sm:w-[18px] sm:h-[18px] ${labelClass}`} />
                  <label className={`text-sm sm:text-base font-semibold ${textClass}`}>Comentarios</label>
                </div>
                {card.comments && card.comments.length > 0 ? (
                  <div className="space-y-3">
                    {card.comments.map(comment => (
                      <div key={comment.id} className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-surface-700/50' : 'bg-surface-100'}`}>
                        <div className="flex items-start gap-2">
                          {comment.user?.avatarUrl && (
                            <img src={comment.user.avatarUrl} alt={comment.user.name} className="w-6 h-6 rounded-full" />
                          )}
                          <div className="flex-1">
                            <p className={`text-xs sm:text-sm font-semibold ${textClass}`}>
                              {comment.user?.name}
                            </p>
                            <p className={`text-xs sm:text-sm ${labelClass} mt-1`}>{comment.content}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={`text-sm ${labelClass}`}>Sin comentarios</p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-inherit bg-surface-50 dark:bg-surface-900/50 flex justify-end gap-2 sm:gap-3">
          <button onClick={onClose} className="btn-secondary text-sm sm:text-base py-1.5 px-3 sm:py-2 sm:px-4">
            Cancelar
          </button>
          <button 
            onClick={handleSave} 
            disabled={!canEditCard}
            className={`btn-primary text-sm sm:text-base py-1.5 px-3 sm:py-2 sm:px-4 flex items-center gap-2 ${!canEditCard ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={!canEditCard ? 'You do not have permission to edit this card' : 'Save changes'}
          >
            {!canEditCard && <Lock className="w-4 h-4" />}
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
};
