import React, { useState } from 'react';
import { Settings, Users, Shield, Eye, EyeOff } from 'lucide-react';
import type { BoardRole } from '../types';
import { MemberManagement } from './MemberManagement';

interface BoardSettingsProps {
  boardId: string;
  boardName: string;
  currentUserRole: BoardRole | null;
  onClose: () => void;
}

export const BoardSettings: React.FC<BoardSettingsProps> = ({
  boardId,
  boardName,
  currentUserRole,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'members' | 'permissions'>('general');
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(boardName);

  const isAdmin = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN';
  const isOwner = currentUserRole === 'OWNER';

  const permissions: Record<string, Record<BoardRole, boolean>> = {
    'View Board': {
      'OWNER': true,
      'ADMIN': true,
      'EDITOR': true,
      'COMMENTER': true,
      'VIEWER': true,
    },
    'Create Cards': {
      'OWNER': true,
      'ADMIN': true,
      'EDITOR': true,
      'COMMENTER': false,
      'VIEWER': false,
    },
    'Edit Cards': {
      'OWNER': true,
      'ADMIN': true,
      'EDITOR': true,
      'COMMENTER': false,
      'VIEWER': false,
    },
    'Delete Cards': {
      'OWNER': true,
      'ADMIN': true,
      'EDITOR': false,
      'COMMENTER': false,
      'VIEWER': false,
    },
    'Manage Members': {
      'OWNER': true,
      'ADMIN': true,
      'EDITOR': false,
      'COMMENTER': false,
      'VIEWER': false,
    },
    'Comment': {
      'OWNER': true,
      'ADMIN': true,
      'EDITOR': true,
      'COMMENTER': true,
      'VIEWER': false,
    },
  };

  const handleSaveBoardName = async () => {
    try {
      // API call to save board name
      // For now just update local state
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving board name:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-96 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <Settings className="w-6 h-6" />
            <h2 className="text-2xl font-bold">Board Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b bg-gray-50">
          <button
            onClick={() => setActiveTab('general')}
            className={`flex-1 px-4 py-3 font-medium transition ${
              activeTab === 'general'
                ? 'border-b-2 border-blue-500 text-blue-500'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            General
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`flex-1 px-4 py-3 font-medium transition ${
              activeTab === 'members'
                ? 'border-b-2 border-blue-500 text-blue-500'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Members
          </button>
          <button
            onClick={() => setActiveTab('permissions')}
            className={`flex-1 px-4 py-3 font-medium transition ${
              activeTab === 'permissions'
                ? 'border-b-2 border-blue-500 text-blue-500'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Shield className="w-4 h-4 inline mr-2" />
            Permissions
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Board Name
                </label>
                {isEditing ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveBoardName}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditedName(boardName);
                        setIsEditing(false);
                      }}
                      className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200">
                    <span>{editedName}</span>
                    {isAdmin && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                )}
              </div>

              {isOwner && (
                <div className="pt-4 border-t">
                  <h4 className="font-medium text-red-600 mb-2">Danger Zone</h4>
                  <button className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
                    Delete Board
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'members' && (
            <MemberManagement
              type="board"
              entityId={boardId}
              currentUserRole={currentUserRole}
            />
          )}

          {activeTab === 'permissions' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Here's what each role can do on this board:
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left">Permission</th>
                      <th className="px-4 py-2 text-center">Owner</th>
                      <th className="px-4 py-2 text-center">Admin</th>
                      <th className="px-4 py-2 text-center">Editor</th>
                      <th className="px-4 py-2 text-center">Commenter</th>
                      <th className="px-4 py-2 text-center">Viewer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(permissions).map(([permission, roles]) => (
                      <tr key={permission} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-2 font-medium">{permission}</td>
                        {(['OWNER', 'ADMIN', 'EDITOR', 'COMMENTER', 'VIEWER'] as const).map((role) => (
                          <td key={role} className="px-4 py-2 text-center">
                            {roles[role] ? (
                              <Eye className="w-4 h-4 text-green-500 inline" />
                            ) : (
                              <EyeOff className="w-4 h-4 text-gray-300 inline" />
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
