import React, { useState } from 'react';
import { X, Plus, Trash2, Edit2, AlertCircle, Loader2 } from 'lucide-react';
import type { BoardMember, WorkspaceMember, BoardRole, WorkspaceRole } from '../types';

interface RoleManagementProps {
  type: 'board' | 'workspace';
  members: (BoardMember | WorkspaceMember)[];
  currentUserRole: BoardRole | WorkspaceRole | null;
  isOwner: boolean;
  onAddMember: (email: string, role: BoardRole | WorkspaceRole) => Promise<void>;
  onUpdateRole: (memberId: string, role: BoardRole | WorkspaceRole) => Promise<void>;
  onRemoveMember: (memberId: string) => Promise<void>;
  onClose: () => void;
}

const roleDescriptions: Record<string, string> = {
  OWNER: 'Full control over board/workspace',
  ADMIN: 'Can manage members and settings',
  EDITOR: 'Can edit cards and lists',
  COMMENTER: 'Can view and comment only',
  VIEWER: 'Read-only access',
  MEMBER: 'Standard member access',
};

export const RoleManagement: React.FC<RoleManagementProps> = ({
  type,
  members,
  currentUserRole,
  isOwner,
  onAddMember,
  onUpdateRole,
  onRemoveMember,
  onClose,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<BoardRole | WorkspaceRole>('VIEWER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<BoardRole | WorkspaceRole>('VIEWER');

  const roles: (BoardRole | WorkspaceRole)[] = type === 'board'
    ? ['OWNER', 'ADMIN', 'EDITOR', 'COMMENTER', 'VIEWER']
    : ['OWNER', 'ADMIN', 'MEMBER'];

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await onAddMember(email, selectedRole);
      setEmail('');
      setSelectedRole('VIEWER');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: BoardRole | WorkspaceRole) => {
    setLoading(true);
    setError('');
    try {
      await onUpdateRole(memberId, newRole);
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;

    setLoading(true);
    setError('');
    try {
      await onRemoveMember(memberId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface-50 dark:bg-surface-900 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-surface-200 dark:border-surface-700">
          <div>
            <h2 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
              {type === 'board' ? 'Board Members' : 'Workspace Members'}
            </h2>
            <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
              Manage roles and permissions
            </p>
          </div>
          <button
            onClick={() => {
              setIsOpen(false);
              onClose();
            }}
            className="p-2 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Error Alert */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-900 dark:text-red-100">{error}</p>
              </div>
            </div>
          )}

          {/* Add Member Form */}
          {isOwner || (currentUserRole === 'ADMIN' || currentUserRole === 'OWNER') ? (
            <div className="p-4 bg-primary-50 dark:bg-primary-950 border border-primary-200 dark:border-primary-800 rounded-lg">
              <h3 className="font-semibold text-surface-900 dark:text-surface-50 mb-4 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add New Member
              </h3>
              <form onSubmit={handleAddMember} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <input
                    type="email"
                    placeholder="member@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="col-span-1 sm:col-span-2 px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    disabled={loading}
                  />
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as BoardRole | WorkspaceRole)}
                    className="px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    disabled={loading}
                  >
                    {roles.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Add Member
                  </button>
                  <p className="text-xs text-surface-500 dark:text-surface-400 self-center">
                    {roleDescriptions[selectedRole]}
                  </p>
                </div>
              </form>
            </div>
          ) : null}

          {/* Members Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-200 dark:border-surface-700">
                  <th className="text-left px-4 py-3 text-sm font-semibold text-surface-700 dark:text-surface-300">Name</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-surface-700 dark:text-surface-300">Email</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-surface-700 dark:text-surface-300">Role</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-surface-700 dark:text-surface-300">Joined</th>
                  <th className="text-center px-4 py-3 text-sm font-semibold text-surface-700 dark:text-surface-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-surface-500 dark:text-surface-400">
                      No members yet
                    </td>
                  </tr>
                ) : (
                  members.map((member) => (
                    <tr
                      key={member.id}
                      className="border-b border-surface-100 dark:border-surface-800 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                            {(member.user?.name || member.user?.email || 'U').charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-surface-900 dark:text-surface-50">
                            {member.user?.name || 'Unknown'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-surface-600 dark:text-surface-400">
                        {member.user?.email || 'N/A'}
                      </td>
                      <td className="px-4 py-3">
                        {editingId === member.id ? (
                          <select
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value as BoardRole | WorkspaceRole)}
                            className="px-2 py-1 border border-surface-300 dark:border-surface-600 rounded bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-50 text-sm"
                            disabled={loading}
                          >
                            {roles.map((role) => (
                              <option key={role} value={role}>
                                {role}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            member.role === 'OWNER'
                              ? 'bg-primary-100 dark:bg-primary-900 text-primary-900 dark:text-primary-100'
                              : member.role === 'ADMIN'
                              ? 'bg-orange-100 dark:bg-orange-900 text-orange-900 dark:text-orange-100'
                              : member.role === 'EDITOR'
                              ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                              : member.role === 'COMMENTER'
                              ? 'bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100'
                              : 'bg-surface-200 dark:bg-surface-700 text-surface-700 dark:text-surface-300'
                          }`}>
                            {member.role}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-surface-600 dark:text-surface-400">
                        {member.joinedAt
                          ? new Date(member.joinedAt).toLocaleDateString()
                          : 'N/A'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          {member.role !== 'OWNER' && (isOwner || currentUserRole === 'ADMIN') ? (
                            <>
                              {editingId === member.id ? (
                                <>
                                  <button
                                    onClick={() => handleUpdateRole(member.id, editRole)}
                                    disabled={loading}
                                    className="p-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                                  >
                                    ✓
                                  </button>
                                  <button
                                    onClick={() => setEditingId(null)}
                                    className="p-1 bg-surface-300 dark:bg-surface-600 rounded hover:bg-surface-400"
                                  >
                                    ✕
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => {
                                      setEditingId(member.id);
                                      setEditRole(member.role);
                                    }}
                                    className="p-1 hover:bg-surface-300 dark:hover:bg-surface-700 rounded transition-colors"
                                  >
                                    <Edit2 className="w-4 h-4 text-primary-500" />
                                  </button>
                                  <button
                                    onClick={() => handleRemoveMember(member.id)}
                                    disabled={loading}
                                    className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded transition-colors disabled:opacity-50"
                                  >
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                  </button>
                                </>
                              )}
                            </>
                          ) : (
                            <span className="text-xs text-surface-500">-</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Role Legend */}
          <div className="p-4 bg-surface-100 dark:bg-surface-800 rounded-lg">
            <h4 className="text-sm font-semibold text-surface-900 dark:text-surface-50 mb-3">Role Permissions</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {roles.map((role) => (
                <div key={role} className="text-xs">
                  <p className="font-medium text-surface-900 dark:text-surface-50">{role}</p>
                  <p className="text-surface-600 dark:text-surface-400">{roleDescriptions[role]}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-surface-200 dark:border-surface-700 p-4 flex justify-end gap-3">
          <button
            onClick={() => {
              setIsOpen(false);
              onClose();
            }}
            className="px-4 py-2 text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
