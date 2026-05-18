import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Shield, X } from 'lucide-react';
import type { User as UserType, BoardRole, WorkspaceRole } from '../types';
import { api } from '../api';

interface MemberManagementProps {
  type: 'board' | 'workspace';
  entityId: string;
  currentUserRole: BoardRole | WorkspaceRole | null;
  onMembersChange?: () => void;
}

interface MemberWithRole {
  id: string;
  userId: string;
  boardId?: string;
  workspaceId?: string;
  role: BoardRole | WorkspaceRole;
  joinedAt: string;
  user?: UserType;
}

const validBoardRoles: BoardRole[] = ['OWNER', 'ADMIN', 'EDITOR', 'COMMENTER', 'VIEWER'];
const validWorkspaceRoles: WorkspaceRole[] = ['OWNER', 'ADMIN', 'MEMBER'];

export const MemberManagement: React.FC<MemberManagementProps> = ({
  type,
  entityId,
  currentUserRole,
  onMembersChange,
}) => {
  const [members, setMembers] = useState<MemberWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<BoardRole | WorkspaceRole>(
    type === 'board' ? 'VIEWER' : 'MEMBER'
  );
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<BoardRole | WorkspaceRole | null>(null);

  const endpoint = type === 'board' ? `/boards/${entityId}/members` : `/workspaces/${entityId}/members`;
  const validRoles = type === 'board' ? validBoardRoles : validWorkspaceRoles;
  const isAdmin = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN';

  // Load members
  useEffect(() => {
    const loadMembers = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${api}${endpoint}`, {
          credentials: 'include',
        });
        if (!response.ok) throw new Error('Failed to load members');
        const data = await response.json();
        setMembers(data.data || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load members');
        console.error('Error loading members:', err);
      } finally {
        setLoading(false);
      }
    };

    loadMembers();
  }, [entityId, type, endpoint]);

  const handleAddMember = async () => {
    if (!newMemberEmail.trim()) return;

    try {
      // Find user by email (this would need a backend endpoint)
      // For now, we'll send the email and let backend handle lookup
      const response = await fetch(`${api}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId: newMemberEmail, // Should be userId, need proper user lookup
          role: newMemberRole,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add member');
      }

      setNewMemberEmail('');
      setNewMemberRole(type === 'board' ? 'VIEWER' : 'MEMBER');
      setShowAddForm(false);

      // Reload members
      const reloadResponse = await fetch(`${api}${endpoint}`, {
        credentials: 'include',
      });
      if (reloadResponse.ok) {
        const data = await reloadResponse.json();
        setMembers(data.data || []);
      }

      onMembersChange?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add member');
      console.error('Error adding member:', err);
    }
  };

  const handleRoleChange = async (memberId: string, userId: string, newRole: BoardRole | WorkspaceRole) => {
    try {
      const response = await fetch(`${api}${endpoint}/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update role');
      }

      // Update local state
      setMembers(members.map((m) => 
        (m.id === memberId || m.userId === userId) ? { ...m, role: newRole as any } : m
      ));
      setEditingMemberId(null);
      setEditingRole(null);
      onMembersChange?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role');
      console.error('Error updating role:', err);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;

    try {
      const response = await fetch(`${api}${endpoint}/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to remove member');
      }

      setMembers(members.filter((m) => m.userId !== userId));
      onMembersChange?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member');
      console.error('Error removing member:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Members
        </h3>
        {isAdmin && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          >
            <Plus className="w-4 h-4" />
            Add Member
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Add member form */}
      {showAddForm && isAdmin && (
        <div className="p-4 bg-gray-50 rounded border border-gray-200 space-y-3">
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="User email"
              value={newMemberEmail}
              onChange={(e) => setNewMemberEmail(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded"
            />
            <select
              value={newMemberRole}
              onChange={(e) => setNewMemberRole(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded"
            >
              {validRoles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
            <button
              onClick={handleAddMember}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
            >
              Add
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-3 py-2 bg-gray-300 rounded hover:bg-gray-400 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Members list */}
      <div className="space-y-2">
        {members.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No members yet</p>
        ) : (
          members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100 transition"
            >
              <div className="flex items-center gap-3 flex-1">
                {member.user?.avatarUrl && (
                  <img
                    src={member.user.avatarUrl}
                    alt={member.user.name}
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <div className="flex-1">
                  <div className="font-medium">{member.user?.name || 'Unknown'}</div>
                  <div className="text-sm text-gray-500">{member.user?.email}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {editingMemberId === member.id ? (
                  <>
                    <select
                      value={editingRole || ''}
                      onChange={(e) => setEditingRole(e.target.value as any)}
                      className="px-2 py-1 border border-gray-300 rounded"
                    >
                      {validRoles.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        if (editingRole) {
                          handleRoleChange(member.id, member.userId, editingRole);
                        }
                      }}
                      className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingMemberId(null);
                        setEditingRole(null);
                      }}
                      className="px-2 py-1 bg-gray-300 rounded hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium">
                      {member.role}
                    </span>
                    {isAdmin && member.role !== 'OWNER' && (
                      <>
                        <button
                          onClick={() => {
                            setEditingMemberId(member.id);
                            setEditingRole(member.role as any);
                          }}
                          className="p-1 hover:bg-blue-100 rounded transition"
                          title="Edit role"
                        >
                          <Edit2 className="w-4 h-4 text-blue-500" />
                        </button>
                        <button
                          onClick={() => handleRemoveMember(member.userId)}
                          className="p-1 hover:bg-red-100 rounded transition"
                          title="Remove member"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
