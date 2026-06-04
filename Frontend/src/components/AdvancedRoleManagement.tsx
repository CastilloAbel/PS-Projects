import React, { useState, useCallback } from 'react';
import { X, Plus, Trash2, Edit2, AlertCircle, Loader2, Search, User, Shield, Info, Mail } from 'lucide-react';
import { searchUsers } from '../api';
import { InviteModal } from './InviteModal';
import type { BoardMember, WorkspaceMember, BoardRole, WorkspaceRole, User as UserType } from '../types';

interface AdvancedRoleManagementProps {
  type: 'board' | 'workspace';
  resourceId?: string; // workspace ID or board ID
  members: (BoardMember | WorkspaceMember)[];
  currentUserRole: BoardRole | WorkspaceRole | null;
  isOwner: boolean;
  onAddMember: (email: string, role: BoardRole | WorkspaceRole) => Promise<void>;
  onUpdateRole: (memberId: string, role: BoardRole | WorkspaceRole) => Promise<void>;
  onRemoveMember: (memberId: string) => Promise<void>;
  onClose: () => void;
}

const roleDescriptions: Record<string, string> = {
  OWNER: 'Full control over board/workspace. Cannot be removed.',
  ADMIN: 'Can manage members, settings, and boards. Can perform administrative tasks.',
  EDITOR: 'Can create and edit cards assigned to them. Can comment on cards.',
  COMMENTER: 'Can view content and add comments. Cannot edit or create.',
  VIEWER: 'Read-only access. Can view but not edit anything.',
  MEMBER: 'Standard workspace member. Can be added to boards with specific roles.',
};

const roleColors: Record<string, string> = {
  OWNER: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
  ADMIN: 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200',
  EDITOR: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
  COMMENTER: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
  VIEWER: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200',
  MEMBER: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200',
};

export const AdvancedRoleManagement: React.FC<AdvancedRoleManagementProps> = ({
  type,
  resourceId,
  members,
  currentUserRole,
  isOwner,
  onAddMember,
  onUpdateRole,
  onRemoveMember,
  onClose,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserType[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [selectedRole, setSelectedRole] = useState<BoardRole | WorkspaceRole>('VIEWER');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<BoardRole | WorkspaceRole>('VIEWER');
  const [showPermissionMatrix, setShowPermissionMatrix] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [invitingMemberId, setInvitingMemberId] = useState<string | null>(null);

  const roles: (BoardRole | WorkspaceRole)[] = type === 'board'
    ? ['OWNER', 'ADMIN', 'EDITOR', 'COMMENTER', 'VIEWER']
    : ['OWNER', 'ADMIN', 'MEMBER'];

  const canManageRoles = isOwner || currentUserRole === 'ADMIN' || currentUserRole === 'OWNER';

  // Debounced search
  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const results = await searchUsers(query);
      // Filter out members already added
      const memberEmails = members.map(m => m.user?.email || '').filter(Boolean);
      setSearchResults(results.filter(u => !memberEmails.includes(u.email)));
    } catch (err) {
      console.error('Error searching users:', err);
    } finally {
      setSearching(false);
    }
  }, [members]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) {
      setError('Please select a user');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await onAddMember(selectedUser.email, selectedRole);
      setSelectedUser(null);
      setSearchQuery('');
      setSearchResults([]);
      setSelectedRole('VIEWER');
    } catch (err: any) {
      setError(err?.response?.data?.error || (err instanceof Error ? err.message : 'Failed to add member'));
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
    } catch (err: any) {
      setError(err?.response?.data?.error || (err instanceof Error ? err.message : 'Failed to update role'));
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
    } catch (err: any) {
      setError(err?.response?.data?.error || (err instanceof Error ? err.message : 'Failed to remove member'));
    } finally {
      setLoading(false);
    }
  };

  const handleInviteByEmail = async (member: BoardMember | WorkspaceMember) => {
    const memberUser = member.user as any;
    setInvitingMemberId(member.id);
    setLoading(true);
    setError('');
    try {
      if (type === 'board') {
        const { sendBoardInvitation } = await import('../api');
        await sendBoardInvitation(resourceId!, memberUser.email, member.role);
      } else {
        const { sendWorkspaceInvitation } = await import('../api');
        await sendWorkspaceInvitation(resourceId!, memberUser.email, member.role);
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || (err instanceof Error ? err.message : 'Failed to send invitation'));
    } finally {
      setLoading(false);
      setInvitingMemberId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface-50 dark:bg-surface-900 rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-surface-200 dark:border-surface-700">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-primary-500" />
            <div>
              <h2 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
                {type === 'board' ? 'Board Members & Roles' : 'Workspace Members & Roles'}
              </h2>
              <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                Manage access and permissions for team members
              </p>
            </div>
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

          {/* Permission Matrix Reference */}
          <button
            onClick={() => setShowPermissionMatrix(!showPermissionMatrix)}
            className="w-full p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center justify-between text-blue-900 dark:text-blue-100 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              <span className="font-medium">View Permission Matrix</span>
            </div>
            <span className={`transform transition-transform ${showPermissionMatrix ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>

          {/* Permission Matrix */}
          {showPermissionMatrix && (
            <div className="p-4 bg-surface-100 dark:bg-surface-800 rounded-lg overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-300 dark:border-surface-600">
                    <th className="text-left py-2 px-2 font-semibold">Action</th>
                    {roles.map(role => (
                      <th key={role} className="text-center py-2 px-2 font-semibold">{role}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="space-y-2">
                  {[
                    { action: 'View', permissions: type === 'board' ? ['✓', '✓', '✓', '✓', '✓'] : ['✓', '✓', '✓'] },
                    { action: 'Create Items', permissions: type === 'board' ? ['✓', '✓', '✓', '✗', '✗'] : ['✓', '✓', '✗'] },
                    { action: 'Edit Items', permissions: type === 'board' ? ['✓', '✓', '✓*', '✗', '✗'] : ['✓', '✓', '✗'] },
                    { action: 'Delete Items', permissions: type === 'board' ? ['✓', '✓', '✗', '✗', '✗'] : ['✓', '✓', '✗'] },
                    { action: 'Manage Members', permissions: type === 'board' ? ['✓', '✓', '✗', '✗', '✗'] : ['✓', '✓', '✗'] },
                    { action: 'Comment', permissions: type === 'board' ? ['✓', '✓', '✓', '✓', '✗'] : ['✓', '✓', '✗'] },
                  ].map(row => (
                    <tr key={row.action} className="border-b border-surface-200 dark:border-surface-700">
                      <td className="py-2 px-2 font-medium">{row.action}</td>
                      {row.permissions.map((perm, idx) => (
                        <td key={idx} className="text-center py-2 px-2">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                            perm === '✓' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                            perm === '✓*' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
                            'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                          }`}>
                            {perm}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs text-surface-500 dark:text-surface-400 mt-3">
                * EDITOR can only edit/delete items they created or are assigned to
              </p>
            </div>
          )}

          {/* Add Member Form */}
          {canManageRoles && (
            <div className="p-4 bg-primary-50 dark:bg-primary-950 border border-primary-200 dark:border-primary-800 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-surface-900 dark:text-surface-50 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add New Member
                </h3>
                <button
                  type="button"
                  onClick={() => setShowInviteModal(true)}
                  className="flex items-center gap-2 px-3 py-1 text-sm bg-secondary-500 hover:bg-secondary-600 text-white rounded-lg transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  Invite by Email
                </button>
              </div>
              <form onSubmit={handleAddMember} className="space-y-4">
                <div className="relative">
                  <div className="flex items-center gap-2 px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-surface-50 dark:bg-surface-800">
                    <Search className="w-4 h-4 text-surface-400" />
                    <input
                      type="text"
                      placeholder="Search users by name or email..."
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="flex-1 bg-transparent text-surface-900 dark:text-surface-50 focus:outline-none placeholder-surface-400 dark:placeholder-surface-500"
                      disabled={loading || searching}
                    />
                  </div>

                  {/* Search Results Dropdown */}
                  {searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-surface-50 dark:bg-surface-800 border border-surface-300 dark:border-surface-600 rounded-lg shadow-lg z-10">
                      {searchResults.map(user => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => {
                            setSelectedUser(user);
                            setSearchQuery('');
                            setSearchResults([]);
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors border-b border-surface-200 dark:border-surface-700 last:border-0 flex items-center gap-3"
                        >
                          <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                            {user.name?.charAt(0) || user.email.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-surface-900 dark:text-surface-50 truncate">{user.name || 'Unknown'}</p>
                            <p className="text-xs text-surface-500 dark:text-surface-400 truncate">{user.email}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selected User Display */}
                {selectedUser && (
                  <div className="p-3 bg-surface-100 dark:bg-surface-800 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        {selectedUser.name?.charAt(0) || selectedUser.email.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-surface-900 dark:text-surface-50">{selectedUser.name || 'Unknown'}</p>
                        <p className="text-xs text-surface-500 dark:text-surface-400">{selectedUser.email}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedUser(null);
                        setSearchQuery('');
                      }}
                      className="p-1 hover:bg-surface-200 dark:hover:bg-surface-700 rounded transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Role Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as BoardRole | WorkspaceRole)}
                    className="px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    disabled={loading}
                  >
                    {roles.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>

                  <button
                    type="submit"
                    disabled={loading || !selectedUser}
                    className="px-4 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Add Member
                  </button>
                </div>

                {/* Role Description */}
                {selectedRole && (
                  <p className="text-sm text-surface-600 dark:text-surface-400">
                    <strong>{selectedRole}:</strong> {roleDescriptions[selectedRole]}
                  </p>
                )}
              </form>
            </div>
          )}

           {/* Members List */}
           <div>
             <h3 className="font-semibold text-surface-900 dark:text-surface-50 mb-3 flex items-center gap-2">
               <User className="w-4 h-4" />
               Current Members ({Array.isArray(members) ? members.length : 0})
             </h3>
             <div className="space-y-2">
               {Array.isArray(members) && members.map((member, idx) => {
                const isEditing = editingId === member.id;
                const memberUser = member.user as any;
                const memberRole = member.role as BoardRole | WorkspaceRole;

                return (
                  <div
                    key={member.id || `member-${idx}`}
                    className="p-4 bg-surface-100 dark:bg-surface-800 rounded-lg flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                        {memberUser?.name?.charAt(0) || memberUser?.email?.charAt(0) || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-surface-900 dark:text-surface-50 truncate">
                          {memberUser?.name || 'Unknown User'}
                        </p>
                        <p className="text-xs text-surface-500 dark:text-surface-400 truncate">{memberUser?.email}</p>
                        {canManageRoles && memberRole !== 'OWNER' && (
                          <button
                            onClick={() => handleInviteByEmail(member)}
                            disabled={loading || invitingMemberId === member.id}
                            className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-primary-500 hover:bg-primary-600 text-white rounded text-xs transition-colors disabled:opacity-50"
                            title="Send invitation email"
                          >
                            {invitingMemberId === member.id ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Sending...
                              </>
                            ) : (
                              <>
                                <Mail className="w-3 h-3" />
                                Invite
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Role Display/Edit */}
                    <div className="flex items-center gap-2 ml-4">
                      {isEditing ? (
                        <select
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value as BoardRole | WorkspaceRole)}
                          className="px-2 py-1 border border-surface-300 dark:border-surface-600 rounded bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-50 text-sm"
                          disabled={loading}
                        >
                          {roles.map(role => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </select>
                      ) : (
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${roleColors[memberRole] || ''}`}>
                          {memberRole}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    {canManageRoles && memberRole !== 'OWNER' && (
                      <div className="flex items-center gap-2 ml-4">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => handleUpdateRole(member.id, editRole)}
                              disabled={loading}
                              className="p-1 bg-green-500 hover:bg-green-600 text-white rounded transition-colors disabled:opacity-50"
                              title="Save"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              disabled={loading}
                              className="p-1 bg-gray-500 hover:bg-gray-600 text-white rounded transition-colors disabled:opacity-50"
                              title="Cancel"
                            >
                              ✕
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setEditingId(member.id);
                                setEditRole(memberRole);
                              }}
                              disabled={loading}
                              className="p-1 hover:bg-surface-200 dark:hover:bg-surface-700 rounded transition-colors disabled:opacity-50"
                              title="Edit role"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRemoveMember(member.id)}
                              disabled={loading}
                              className="p-1 hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400 rounded transition-colors disabled:opacity-50"
                              title="Remove member"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
               })}

               {(!Array.isArray(members) || members.length === 0) && (
                 <div className="text-center py-8 text-surface-500 dark:text-surface-400">
                   <p>No members yet. Add one to get started!</p>
                 </div>
               )}
             </div>
           </div>
        </div>
      </div>

      {/* Invite Modal - Renderizar fuera del contenedor principal para mejor z-index */}
      {showInviteModal && (
        <InviteModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          type={type}
          workspaceId={type === 'workspace' ? resourceId : undefined}
          boardId={type === 'board' ? resourceId : undefined}
          onInviteSent={() => {
            // Optionally refresh the members list
            // onRefreshMembers?.();
          }}
        />
      )}
    </div>
  );
};
