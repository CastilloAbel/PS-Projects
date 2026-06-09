import React, { useState } from 'react';
import {
  LayoutGrid,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Plus,
  FolderOpen,
} from 'lucide-react';
import type { Workspace, Board } from '../types';

interface SidebarProps {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  currentBoard: Board | null;
  onWorkspaceSelect: (workspace: Workspace) => void;
  onBoardSelect: (board: Board) => void;
  onCreateWorkspace: () => void;
  onCreateBoard: () => void;
  onLogout: () => void;
  userName: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  workspaces,
  currentWorkspace,
  currentBoard,
  onWorkspaceSelect,
  onBoardSelect,
  onCreateWorkspace,
  onCreateBoard,
  onLogout,
  userName,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(true);

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 md:hidden p-3 bg-primary-500 text-white rounded-full shadow-lg hover:bg-primary-600 z-30"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen bg-surface-900 text-surface-50 flex flex-col shadow-lg transition-transform duration-300 z-20 w-64 ${
          !isOpen ? '-translate-x-full md:translate-x-0' : ''
        }`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-surface-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center font-bold">
              PS
            </div>
            <div>
              <h2 className="font-bold text-lg">Pirate Ship</h2>
              <p className="text-xs text-surface-400">Project Manager</p>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-surface-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center font-bold text-sm">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{userName}</p>
              <p className="text-xs text-surface-400">User</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {/* Workspaces Section */}
          <div>
            <button
              onClick={() => setIsWorkspaceOpen(!isWorkspaceOpen)}
              className="w-full flex items-center justify-between px-4 py-2 text-surface-300 hover:text-white transition-colors"
            >
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4" />
                <span className="text-sm font-medium">Workspaces</span>
              </div>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  isWorkspaceOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isWorkspaceOpen && (
              <div className="ml-4 mt-2 space-y-1">
                {workspaces.map((ws) => (
                  <button
                    key={ws.id}
                    onClick={() => {
                      onWorkspaceSelect(ws);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 rounded text-sm transition-colors ${
                      currentWorkspace?.id === ws.id
                        ? 'bg-primary-500 text-white'
                        : 'text-surface-400 hover:text-surface-50 hover:bg-surface-800'
                    }`}
                  >
                    {ws.name}
                  </button>
                ))}

                <button
                  onClick={onCreateWorkspace}
                  className="w-full flex items-center gap-2 px-4 py-2 text-surface-400 hover:text-surface-50 hover:bg-surface-800 rounded text-sm transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Workspace</span>
                </button>
              </div>
            )}
          </div>

          {/* Boards Section */}
          {currentWorkspace && (
            <div className="mt-4 pt-4 border-t border-surface-700">
              <div className="px-4 py-2 text-surface-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4" />
                    <span className="text-sm font-medium">Boards</span>
                  </div>
                  <button
                    onClick={onCreateBoard}
                    className="p-1 hover:bg-surface-700 rounded transition-colors"
                    title="Create new board"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="ml-4 mt-2 space-y-1">
                {currentWorkspace.boards && currentWorkspace.boards.length > 0 ? (
                  currentWorkspace.boards.map((board) => (
                    <button
                      key={board.id}
                      onClick={() => {
                        onBoardSelect(board);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 rounded text-sm transition-colors truncate ${
                        currentBoard?.id === board.id
                          ? 'bg-primary-500 text-white'
                          : 'text-surface-400 hover:text-surface-50 hover:bg-surface-800'
                      }`}
                    >
                      {board.name}
                    </button>
                  ))
                ) : (
                  <p className="px-4 py-2 text-xs text-surface-500 italic">
                    No boards yet
                  </p>
                )}
              </div>
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-surface-700 space-y-2">
          <button className="w-full flex items-center gap-2 px-4 py-2 text-surface-400 hover:text-surface-50 hover:bg-surface-800 rounded transition-colors">
            <Settings className="w-4 h-4" />
            <span className="text-sm">Settings</span>
          </button>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-950 rounded transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 md:hidden z-10"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};
