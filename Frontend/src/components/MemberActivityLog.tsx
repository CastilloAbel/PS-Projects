import React, { useState, useEffect } from 'react';
import { Clock, ArrowRight, Filter, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ActivityLog {
  id: string;
  timestamp: string;
  action: 'ADD_MEMBER' | 'REMOVE_MEMBER' | 'UPDATE_ROLE' | 'PROMOTE' | 'DEMOTE';
  performedBy: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  targetMember: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  details: {
    fromRole?: string;
    toRole?: string;
    oldRole?: string;
    newRole?: string;
  };
}

interface MemberActivityLogProps {
  isOpen: boolean;
  onClose: () => void;
  memberName?: string;
  activities?: ActivityLog[];
}

const actionLabels: Record<string, string> = {
  ADD_MEMBER: 'Added to',
  REMOVE_MEMBER: 'Removed from',
  UPDATE_ROLE: 'Role changed',
  PROMOTE: 'Promoted to',
  DEMOTE: 'Demoted to',
};

const roleColors: Record<string, string> = {
  OWNER: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20',
  ADMIN: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20',
  EDITOR: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20',
  COMMENTER: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
  VIEWER: 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20',
  MEMBER: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20',
};

export const MemberActivityLog: React.FC<MemberActivityLogProps> = ({
  isOpen,
  onClose,
  memberName,
  activities = [],
}) => {
  const { theme } = useTheme();
  const [filteredActivities, setFilteredActivities] = useState<ActivityLog[]>(activities);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  useEffect(() => {
    if (selectedAction) {
      setFilteredActivities(activities.filter(a => a.action === selectedAction));
    } else {
      setFilteredActivities(activities);
    }
  }, [selectedAction, activities]);

  if (!isOpen) return null;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Ayer';
    }
    return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
  };

  const allActions = Array.from(new Set(activities.map(a => a.action)));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] flex flex-col ${theme === 'dark' ? 'bg-surface-900 border-surface-700' : 'bg-white border-surface-200'} border`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-inherit">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-primary-500" />
            <div>
              <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-surface-50' : 'text-surface-900'}`}>
                Activity Log
              </h2>
              {memberName && (
                <p className={`text-sm ${theme === 'dark' ? 'text-surface-400' : 'text-surface-500'}`}>
                  Changes for {memberName}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-surface-800' : 'hover:bg-surface-100'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 border-b border-inherit flex flex-wrap gap-2 items-center">
          <Filter className={`w-4 h-4 ${theme === 'dark' ? 'text-surface-400' : 'text-surface-500'}`} />
          <span className={`text-sm font-medium ${theme === 'dark' ? 'text-surface-400' : 'text-surface-500'}`}>Filter:</span>
          {allActions.map(action => (
            <button
              key={action}
              onClick={() => setSelectedAction(selectedAction === action ? null : action)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedAction === action
                  ? 'bg-primary-500 text-white'
                  : theme === 'dark'
                  ? 'bg-surface-800 text-surface-300 hover:bg-surface-700'
                  : 'bg-surface-100 text-surface-700 hover:bg-surface-200'
              }`}
            >
              {actionLabels[action]}
            </button>
          ))}
          {selectedAction && (
            <button
              onClick={() => setSelectedAction(null)}
              className="text-xs text-primary-500 hover:text-primary-600 font-medium ml-auto"
            >
              Clear filter
            </button>
          )}
        </div>

        {/* Activity List */}
        <div className={`flex-1 overflow-y-auto ${theme === 'dark' ? 'divide-surface-700' : 'divide-surface-200'} divide-y`}>
          {filteredActivities.length > 0 ? (
            filteredActivities.map((activity) => (
              <div
                key={activity.id}
                className={`p-4 hover:bg-opacity-50 transition-colors ${theme === 'dark' ? 'hover:bg-surface-800' : 'hover:bg-surface-50'}`}
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 ${theme === 'dark' ? 'bg-primary-600' : 'bg-primary-500'}`}>
                    {activity.performedBy.name?.charAt(0) || activity.performedBy.email.charAt(0)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className={`font-medium ${theme === 'dark' ? 'text-surface-50' : 'text-surface-900'}`}>
                        {activity.performedBy.name || 'Unknown'}
                      </span>
                      <span className={`text-sm ${theme === 'dark' ? 'text-surface-400' : 'text-surface-500'}`}>
                        {actionLabels[activity.action]}
                      </span>
                      <span className={`font-medium ${theme === 'dark' ? 'text-surface-50' : 'text-surface-900'}`}>
                        {activity.targetMember.name || 'Unknown'}
                      </span>
                    </div>

                    {/* Role Change Details */}
                    {(activity.details.fromRole || activity.details.toRole) && (
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${roleColors[activity.details.fromRole || ''] || ''}`}>
                          {activity.details.fromRole || activity.details.oldRole}
                        </span>
                        <ArrowRight className="w-3 h-3 text-gray-400" />
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${roleColors[activity.details.toRole || ''] || ''}`}>
                          {activity.details.toRole || activity.details.newRole}
                        </span>
                      </div>
                    )}

                    {/* Timestamp */}
                    <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-surface-500' : 'text-surface-400'}`}>
                      {formatDate(activity.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className={`p-8 text-center ${theme === 'dark' ? 'text-surface-400' : 'text-surface-500'}`}>
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No activity log entries</p>
              <p className="text-sm mt-1">Member history will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
