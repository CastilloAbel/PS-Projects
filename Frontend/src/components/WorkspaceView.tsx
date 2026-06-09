import React, { useState, useEffect } from 'react';
import { Loader2, Settings } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { Board } from './Board';
import { AdvancedRoleManagement } from './AdvancedRoleManagement';
import { CreateBoardModal } from './CreateBoardModal';
import { EditBoardModal } from './EditBoardModal';
import { useTheme } from '../context/ThemeContext';
import { usePermission } from '../context/PermissionContext';
import { useAuth } from '../context/AuthContext';
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
  updateBoard,
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
  const { user: currentUser } = useAuth();
  const [workspace, setWorkspace] = useState<Workspace>(initialWorkspace);
  const [selectedBoard, setSelectedBoard] = useState<BoardType | null>(null);
  const [showRoleManagement, setShowRoleManagement] = useState<'board' | 'workspace' | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreateBoardModal, setShowCreateBoardModal] = useState(false);
  const [creatingBoard, setCreatingBoard] = useState(false);
  const [showEditBoardModal, setShowEditBoardModal] = useState(false);
  const [updatingBoard, setUpdatingBoard] = useState(false);

  // Fetch workspace members automatically when workspace changes
  useEffect(() => {
    const loadMembers = async () => {
      try {
        const members = await getWorkspaceMembers(workspace.id);
        setWorkspace((prev) => ({
          ...prev,
          members: members as WorkspaceMember[],
        }));
      } catch (error) {
        console.error('Error loading workspace members:', error);
      }
    };
    if (workspace?.id) {
      loadMembers();
    }
  }, [workspace.id]);

  // Helper para obtener el rol del usuario actual en workspace
  const getCurrentUserWorkspaceRole = () => {
    if (!currentUser || !workspace.members || !Array.isArray(workspace.members)) return null;
    const currentMember = workspace.members.find(m => m.userId === currentUser.id);
    return currentMember?.role as any || null;
  };

  // Helper para obtener el rol del usuario actual en board
  const getCurrentUserBoardRole = () => {
    if (!currentUser || !selectedBoard?.members || !Array.isArray(selectedBoard.members)) return null;
    const currentMember = selectedBoard.members.find(m => m.userId === currentUser.id);
    return currentMember?.role as any || null;
  };

  // Helper para verificar si usuario actual es owner del workspace
  const isCurrentUserWorkspaceOwner = () => {
    return workspace.ownerId === currentUser?.id;
  };

  // Helper para verificar si usuario actual es owner del board
  const isCurrentUserBoardOwner = () => {
    return selectedBoard?.ownerId === currentUser?.id;
  };

  // Update workspace when prop changes
  useEffect(() => {
    setWorkspace(initialWorkspace);
  }, [initialWorkspace]);

  // Set workspace context when workspace changes
  useEffect(() => {
    if (workspace) {
      setWorkspaceContext(workspace.id, workspace.members?.[0]?.role as any || null);
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
      setBoardContext(completeBoard.id, (completeBoard.members?.[0]?.role as any) || null);
    } catch (error) {
      console.error('Error loading board:', error);
      // Fallback to the provided board data
      setSelectedBoard(board);
      setBoardContext(board.id, (board.members?.[0]?.role as any) || null);
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
        members: members as WorkspaceMember[],
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
        members: members as WorkspaceMember[],
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
        members: members as WorkspaceMember[],
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
        members: members as BoardMember[],
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
        members: members as BoardMember[],
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
        members: members as BoardMember[],
      });
    } catch (error) {
      console.error('Error removing board member:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Handle create board
  const handleCreateBoard = () => {
    setShowCreateBoardModal(true);
  };

  const handleSubmitCreateBoard = async (
    name: string,
    background?: string,
    type?: string,
    status?: string,
    startDate?: string | null,
    members?: string[]
  ) => {
    setCreatingBoard(true);
    try {
      const newBoard = await createBoard(
        name,
        workspace.id,
        background,
        type,
        status,
        startDate,
        members
      );

      // Ensure the new board has lists array
      const sanitizedBoard = {
        ...newBoard,
        lists: newBoard.lists || [],
      };

      // Update workspace with new board
      setWorkspace({
        ...workspace,
        boards: [...(workspace.boards || []), sanitizedBoard],
      });

      setShowCreateBoardModal(false);
      // Auto-select the new board
      setSelectedBoard(sanitizedBoard);
      setBoardContext(sanitizedBoard.id, (sanitizedBoard.members?.[0]?.role as any) || null);
    } catch (error) {
      console.error('Error creating board:', error);
      throw error;
    } finally {
      setCreatingBoard(false);
    }
  };

  const handleSubmitEditBoard = async (updates: Partial<BoardType>) => {
    if (!selectedBoard) return;
    setUpdatingBoard(true);
    try {
      const updatedBoard = await updateBoard(selectedBoard.id, updates);

      // Update selectedBoard state
      setSelectedBoard((prev) => (prev ? { ...prev, ...updatedBoard } : null));

      // Update workspace.boards state
      setWorkspace((prev) => ({
        ...prev,
        boards: prev.boards?.map((b) => (b.id === selectedBoard.id ? { ...b, ...updatedBoard } : b)) || [],
      }));

      setShowEditBoardModal(false);
    } catch (error) {
      console.error('Error updating board:', error);
      throw error;
    } finally {
      setUpdatingBoard(false);
    }
  };

  return (
    <div className="flex h-screen bg-surface-50 dark:bg-surface-950">
      {/* Sidebar */}
      <Sidebar
        workspaces={workspaces}
        currentWorkspace={workspace}
        currentBoard={selectedBoard}
        onWorkspaceSelect={onWorkspaceSelect}
        onBoardSelect={handleSelectBoard}
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
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold text-surface-900 dark:text-surface-50">
                    {selectedBoard.name}
                  </h2>
                  <span className={`text-xs px-2.5 py-0.5 font-semibold rounded-full ${
                    selectedBoard.status === 'FINALIZADO'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : selectedBoard.status === 'EN_DESARROLLO'
                      ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}>
                    {selectedBoard.status === 'FINALIZADO'
                      ? 'Finalizado'
                      : selectedBoard.status === 'EN_DESARROLLO'
                      ? 'En Desarrollo'
                      : 'Creado'}
                  </span>
                </div>
                <div className="flex gap-3 items-center">
                  <button
                    onClick={() => setShowEditBoardModal(true)}
                    className="p-2 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700 hover:text-surface-900 dark:hover:text-surface-100 rounded-lg transition-colors"
                    title="Configuración del proyecto"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
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
                    if (selectedBoard) {
                      handleSelectBoard(selectedBoard);
                    }
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
                  {workspace.boards.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => handleSelectBoard(b)}
                      className="p-6 bg-surface-100 dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700 hover:border-primary-500 dark:hover:border-primary-500 transition-all hover:shadow-lg text-left group"
                    >
                      <div className="flex justify-between items-start mb-2 gap-2">
                        <h3 className="text-lg font-bold text-surface-900 dark:text-surface-50 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate flex-1">
                          {b.name}
                        </h3>
                        <span className={`text-xs px-2 py-0.5 font-semibold rounded-full shrink-0 ${
                          b.status === 'FINALIZADO'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : b.status === 'EN_DESARROLLO'
                            ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}>
                          {b.status === 'FINALIZADO'
                            ? 'Finalizado'
                            : b.status === 'EN_DESARROLLO'
                            ? 'En Desarrollo'
                            : 'Creado'}
                        </span>
                      </div>
                      <p className="text-sm text-surface-600 dark:text-surface-400 mb-4">
                        {b.lists?.length || 0} list{(b.lists?.length || 0) !== 1 ? 's' : ''}
                      </p>
                      <div className="flex gap-2">
                        <span className="text-xs px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-900 dark:text-primary-100 rounded">
                          {b.ownerId === currentUser?.id ? 'Owned' : 'Member'}
                        </span>
                        <span className="text-xs px-2 py-1 bg-surface-200 dark:bg-surface-700 text-surface-700 dark:text-surface-300 rounded font-semibold">
                          {b.type === 'GANTT' ? 'Gantt' : 'Kanban'}
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
        <AdvancedRoleManagement
          type="workspace"
          resourceId={workspace.id}
          members={(workspace.members || []) as WorkspaceMember[]}
          currentUserRole={getCurrentUserWorkspaceRole()}
          isOwner={isCurrentUserWorkspaceOwner()}
          onAddMember={handleAddWorkspaceMember}
          onUpdateRole={handleUpdateWorkspaceMemberRole}
          onRemoveMember={handleRemoveWorkspaceMember}
          onClose={() => setShowRoleManagement(null)}
        />
      )}

      {showRoleManagement === 'board' && selectedBoard && (
        <AdvancedRoleManagement
          type="board"
          resourceId={selectedBoard.id}
          members={(selectedBoard.members || []) as BoardMember[]}
          currentUserRole={getCurrentUserBoardRole()}
          isOwner={isCurrentUserBoardOwner()}
          onAddMember={handleAddBoardMember}
          onUpdateRole={handleUpdateBoardMemberRole}
          onRemoveMember={handleRemoveBoardMember}
          onClose={() => setShowRoleManagement(null)}
        />
      )}

      {/* Create Board Modal */}
      {showCreateBoardModal && (
        <CreateBoardModal
          isOpen={showCreateBoardModal}
          isLoading={creatingBoard}
          workspaceName={workspace.name}
          workspaceMembers={workspace.members}
          onSubmit={handleSubmitCreateBoard}
          onClose={() => setShowCreateBoardModal(false)}
        />
      )}

      {/* Edit Board Modal */}
      {showEditBoardModal && selectedBoard && (
        <EditBoardModal
          isOpen={showEditBoardModal}
          isLoading={updatingBoard}
          board={selectedBoard}
          onSubmit={handleSubmitEditBoard}
          onClose={() => setShowEditBoardModal(false)}
        />
      )}
    </div>
  );
};
