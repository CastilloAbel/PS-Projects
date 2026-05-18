import React, { createContext, useContext, type ReactNode, useState } from 'react';
import type { BoardRole, WorkspaceRole } from '../types';

interface PermissionContextType {
  // Current permissions
  currentBoardId: string | null;
  currentWorkspaceId: string | null;
  boardRole: BoardRole | null;
  workspaceRole: WorkspaceRole | null;

  // Permission checks
  canViewBoard: boolean;
  canCreateCard: boolean;
  canEditCard: boolean;
  canDeleteCard: boolean;
  canManageBoardMembers: boolean;
  canCommentCard: boolean;

  canViewWorkspace: boolean;
  canManageWorkspaceMembers: boolean;

  // Getters
  isBoardOwner: boolean;
  isBoardAdmin: boolean;
  isBoardEditor: boolean;
  isWorkspaceOwner: boolean;
  isWorkspaceAdmin: boolean;

  // Setters
  setBoardContext: (boardId: string | null, role: BoardRole | null) => void;
  setWorkspaceContext: (workspaceId: string | null, role: WorkspaceRole | null) => void;
  reset: () => void;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export const PermissionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentBoardId, setCurrentBoardId] = useState<string | null>(null);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null);
  const [boardRole, setBoardRole] = useState<BoardRole | null>(null);
  const [workspaceRole, setWorkspaceRole] = useState<WorkspaceRole | null>(null);

  // Compute permissions based on roles
  const getPermissions = () => {
    const permissions = {
      // Board permissions
      canViewBoard: boardRole !== null,
      canCreateCard: boardRole === 'OWNER' || boardRole === 'ADMIN' || boardRole === 'EDITOR',
      canEditCard: boardRole === 'OWNER' || boardRole === 'ADMIN' || boardRole === 'EDITOR',
      canDeleteCard: boardRole === 'OWNER' || boardRole === 'ADMIN',
      canManageBoardMembers: boardRole === 'OWNER' || boardRole === 'ADMIN',
      canCommentCard: boardRole !== null && boardRole !== 'VIEWER', // Can comment if not just viewer

      // Workspace permissions
      canViewWorkspace: workspaceRole !== null,
      canManageWorkspaceMembers: workspaceRole === 'OWNER' || workspaceRole === 'ADMIN',

      // Role checks
      isBoardOwner: boardRole === 'OWNER',
      isBoardAdmin: boardRole === 'OWNER' || boardRole === 'ADMIN',
      isBoardEditor: boardRole === 'OWNER' || boardRole === 'ADMIN' || boardRole === 'EDITOR',
      isWorkspaceOwner: workspaceRole === 'OWNER',
      isWorkspaceAdmin: workspaceRole === 'OWNER' || workspaceRole === 'ADMIN',
    };

    return permissions;
  };

  const permissions = getPermissions();

  const setBoardContext = (boardId: string | null, role: BoardRole | null) => {
    setCurrentBoardId(boardId);
    setBoardRole(role);
  };

  const setWorkspaceContext = (workspaceId: string | null, role: WorkspaceRole | null) => {
    setCurrentWorkspaceId(workspaceId);
    setWorkspaceRole(role);
  };

  const reset = () => {
    setCurrentBoardId(null);
    setCurrentWorkspaceId(null);
    setBoardRole(null);
    setWorkspaceRole(null);
  };

  const value: PermissionContextType = {
    currentBoardId,
    currentWorkspaceId,
    boardRole,
    workspaceRole,
    ...permissions,
    setBoardContext,
    setWorkspaceContext,
    reset,
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermission = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermission debe usarse dentro de PermissionProvider');
  }
  return context;
};

// Utility hook for checking multiple permissions
export const useCanDo = (action: keyof Omit<PermissionContextType, 'setBoardContext' | 'setWorkspaceContext' | 'reset' | 'currentBoardId' | 'currentWorkspaceId' | 'boardRole' | 'workspaceRole'>) => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('useCanDo debe usarse dentro de PermissionProvider');
  }
  return context[action];
};
