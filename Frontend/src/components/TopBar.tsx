import React from 'react';
import { Settings, Users, Bell, Search, Moon, Sun } from 'lucide-react';
import type { Workspace } from '../types';

interface TopBarProps {
  workspace: Workspace | null;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
  onOpenSettings: () => void;
  onOpenMembers: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  workspace,
  theme,
  onThemeToggle,
  onOpenSettings,
  onOpenMembers,
}) => {
  return (
    <div className="h-14 bg-surface-50 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700 flex items-center justify-between px-6 sticky top-0 z-10">
      {/* Left Section - Title */}
      <div>
        <h1 className="text-xl font-bold text-surface-900 dark:text-surface-50">
          {workspace ? workspace.name : 'Workspace'}
        </h1>
        <p className="text-xs text-surface-500 dark:text-surface-400">
          {workspace?.description || 'Project Management'}
        </p>
      </div>

      {/* Right Section - Controls */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="hidden sm:flex items-center gap-2 bg-surface-100 dark:bg-surface-800 rounded-lg px-3 py-2">
          <Search className="w-4 h-4 text-surface-400" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent text-sm outline-none placeholder-surface-400 dark:placeholder-surface-500"
          />
        </div>

        {/* Notifications */}
        <button className="relative p-2 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors">
          <Bell className="w-5 h-5 text-surface-600 dark:text-surface-400" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* Members */}
        <button
          onClick={onOpenMembers}
          className="flex items-center gap-2 p-2 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-50"
        >
          <Users className="w-5 h-5" />
          <span className="text-xs font-medium hidden sm:inline">Members</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={onThemeToggle}
          className="p-2 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors"
        >
          {theme === 'light' ? (
            <Moon className="w-5 h-5 text-surface-600" />
          ) : (
            <Sun className="w-5 h-5 text-surface-400" />
          )}
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          className="p-2 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors text-surface-600 dark:text-surface-400"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
