import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { Board } from './Board';
import { RoleManagement } from './RoleManagement';
import { useTheme } from '../context/ThemeContext';
import { usePermission } from '../context/PermissionContext';
import {
  addWorkspaceMember,
  getWorkspaceMembers,
  updateWorkspaceMemberRole,
  removeWorkspaceMember,
  addBoardMember,
  getBoardMembers,
  updateBoardMemberRole,
  removeBoardMember,
  getBoard,
  createBoard,
} from '../api';
import type { Workspace, Board as BoardType, BoardMember, WorkspaceMember } from '../types';

interface WorkspaceViewProps {
  workspace: Workspace;
  workspaces: Workspace[];
  onWorkspaceSelect: (workspace: Workspace) => void;
  onCreateWorkspace: () => void;
  onLogout: () => void;
  userName: string;
}

export const WorkspaceView: React.FC<WorkspaceViewProps> = ({
  workspace: initialWorkspace,
  workspaces,
  onWorkspaceSelect,
  onCreateWorkspace,
  onLogout,
  userName,
}) => {
  const { theme, toggleTheme } = useTheme();
  const { setBoardContext, setWorkspaceContext } = usePermission();
  const [workspace, setWorkspace] = useState<Workspace>(initialWorkspace);
  const [selectedBoard, setSelectedBoard] = useState<BoardType | null>(null);
  const [showRoleManagement, setShowRoleManagement] = useState<'board' | 'workspace' | null>(null);
  const [loading, setLoading] = useState(false);

  // Update workspace when prop changes
  useEffect(() => {
    setWorkspace(initialWorkspace);
  }, [initialWorkspace]);

  // Set workspace context when workspace changes
  useEffect(() => {
    if (workspace) {
      setWorkspaceContext(workspace.id, workspace.workspaceMembers?.[0]?.role as any || null);
    }
  }, [workspace, setWorkspaceContext]);

  // Handle board selection
  const handleSelectBoard = async (board: BoardType) => {
    setLoading(true);
    try {
      // Load complete board data from API
      const completeBoard = await getBoard(board.id);
      setSelectedBoard({
        ...completeBoard,
        lists: completeBoard.lists || [],
      });
      setBoardContext(completeBoard.id, (completeBoard.boardMembers?.[0]?.role as any) || null);
    } catch (error) {
      console.error('Error loading board:', error);
      // Fallback to the provided board data
      setSelectedBoard(board);
      setBoardContext(board.id, (board.boardMembers?.[0]?.role as any) || null);
    } finally {
      setLoading(false);
    }
  };

  // Handle adding workspace member
  const handleAddWorkspaceMember = async (email: string, role: string) => {
    setLoading(true);
    try {
      await addWorkspaceMember(workspace.id, email, role);
      // Refresh members
      const members = await getWorkspaceMembers(workspace.id);
      setWorkspace({
        ...workspace,
        workspaceMembers: members as WorkspaceMember[],
      });
    } catch (error) {
      console.error('Error adding workspace member:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Handle updating workspace member role
  const handleUpdateWorkspaceMemberRole = async (memberId: string, role: string) => {
    setLoading(true);
    try {
      await updateWorkspaceMemberRole(workspace.id, memberId, role);
      // Refresh members
      const members = await getWorkspaceMembers(workspace.id);
      setWorkspace({
        ...workspace,
        workspaceMembers: members as WorkspaceMember[],
      });
    } catch (error) {
      console.error('Error updating workspace member role:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Handle removing workspace member
  const handleRemoveWorkspaceMember = async (memberId: string) => {
    setLoading(true);
    try {
      await removeWorkspaceMember(workspace.id, memberId);
      // Refresh members
      const members = await getWorkspaceMembers(workspace.id);
      setWorkspace({
        ...workspace,
        workspaceMembers: members as WorkspaceMember[],
      });
    } catch (error) {
      console.error('Error removing workspace member:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Handle adding board member
  const handleAddBoardMember = async (email: string, role: string) => {
    if (!selectedBoard) return;
    setLoading(true);
    try {
      await addBoardMember(selectedBoard.id, email, role);
      // Refresh board members
      const members = await getBoardMembers(selectedBoard.id);
      setSelectedBoard({
        ...selectedBoard,
        boardMembers: members as BoardMember[],
      });
    } catch (error) {
      console.error('Error adding board member:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Handle updating board member role
  const handleUpdateBoardMemberRole = async (memberId: string, role: string) => {
    if (!selectedBoard) return;
    setLoading(true);
    try {
      await updateBoardMemberRole(selectedBoard.id, memberId, role);
      // Refresh board members
      const members = await getBoardMembers(selectedBoard.id);
      setSelectedBoard({
        ...selectedBoard,
        boardMembers: members as BoardMember[],
      });
    } catch (error) {
      console.error('Error updating board member role:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Handle removing board member
  const handleRemoveBoardMember = async (memberId: string) => {
    if (!selectedBoard) return;
    setLoading(true);
    try {
      await removeBoardMember(selectedBoard.id, memberId);
      // Refresh board members
      const members = await getBoardMembers(selectedBoard.id);
      setSelectedBoard({
        ...selectedBoard,
        boardMembers: members as BoardMember[],
      });
    } catch (error) {
      console.error('Error removing board member:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Handle create board
  const handleCreateBoard = async () => {
    const boardName = prompt('Enter board name:', 'New Board');
    if (!boardName) return;

    setLoading(true);
    try {
      const newBoard = await createBoard(boardName, workspace.id);
      
      // Update workspace with new board
      setWorkspace({
        ...workspace,
        boards: [...(workspace.boards || []), newBoard],
      });
    } catch (error) {
      console.error('Error creating board:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-surface-50 dark:bg-surface-950">
      {/* Sidebar */}
      <Sidebar
        workspaces={workspaces}
        currentWorkspace={workspace}
        onWorkspaceSelect={onWorkspaceSelect}
        onCreateWorkspace={onCreateWorkspace}
        onCreateBoard={handleCreateBoard}
        onLogout={onLogout}
        userName={userName}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:ml-64">
        {/* Top Bar */}
        <TopBar
          workspace={workspace}
          theme={theme}
          onThemeToggle={toggleTheme}
          onOpenSettings={() => setShowRoleManagement('workspace')}
          onOpenMembers={() => setShowRoleManagement('workspace')}
        />

        {/* Content Area */}
        <main className="flex-1 overflow-auto">
          {selectedBoard ? (
            // Board View
            <div className="h-full flex flex-col">
              {/* Board Top Bar */}
              <div className="bg-surface-100 dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <h2 className="text-lg font-bold text-surface-900 dark:text-surface-50">
                  {selectedBoard.name}
                </h2>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowRoleManagement('board')}
                    className="px-4 py-2 text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700 rounded-lg transition-colors"
                  >
                    Members
                  </button>
                  <button
                    onClick={() => setSelectedBoard(null)}
                    className="px-4 py-2 text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700 rounded-lg transition-colors"
                  >
                    Back
                  </button>
                </div>
              </div>

              {/* Board Content */}
              <div className="flex-1 overflow-auto">
                <Board
                  initialBoard={selectedBoard}
                  onBoardUpdate={() => {
                    // Handle board update
                  }}
                />
              </div>
            </div>
          ) : (
            // Workspace Overview
            <div className="p-6">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-surface-900 dark:text-surface-50 mb-2">
                  Boards
                </h2>
                <p className="text-surface-600 dark:text-surface-400">
                  Select a board to open it
                </p>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                </div>
              ) : workspace.boards && workspace.boards.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {workspace.boards.map((board) => (
                    <button
                      key={board.id}
                      onClick={() => handleSelectBoard(board)}
                      className="p-6 bg-surface-100 dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700 hover:border-primary-500 dark:hover:border-primary-500 transition-all hover:shadow-lg text-left group"
                    >
                      <h3 className="text-lg font-bold text-surface-900 dark:text-surface-50 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors mb-2">
                        {board.name}
                      </h3>
                      <p className="text-sm text-surface-600 dark:text-surface-400 mb-4">
                        {board.lists?.length || 0} list{(board.lists?.length || 0) !== 1 ? 's' : ''}
                      </p>
                      <div className="flex gap-2">
                        <span className="text-xs px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-900 dark:text-primary-100 rounded">
                          {board.ownerId ? 'Owned' : 'Member'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <p className="text-surface-600 dark:text-surface-400 mb-4">
                    No boards yet. Create one to get started!
                  </p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Role Management Modal */}
      {showRoleManagement === 'workspace' && (
        <RoleManagement
          type="workspace"
          members={(workspace.workspaceMembers || []) as WorkspaceMember[]}
          currentUserRole={workspace.workspaceMembers?.[0]?.role as any}
          isOwner={workspace.ownerId === workspace.workspaceMembers?.[0]?.userId}
          onAddMember={handleAddWorkspaceMember}
          onUpdateRole={handleUpdateWorkspaceMemberRole}
          onRemoveMember={handleRemoveWorkspaceMember}
          onClose={() => setShowRoleManagement(null)}
        />
      )}

      {showRoleManagement === 'board' && selectedBoard && (
        <RoleManagement
          type="board"
          members={(selectedBoard.boardMembers || []) as BoardMember[]}
          currentUserRole={selectedBoard.boardMembers?.[0]?.role as any}
          isOwner={selectedBoard.ownerId === selectedBoard.boardMembers?.[0]?.userId}
          onAddMember={handleAddBoardMember}
          onUpdateRole={handleUpdateBoardMemberRole}
          onRemoveMember={handleRemoveBoardMember}
          onClose={() => setShowRoleManagement(null)}
        />
      )}
    </div>
  );
};
