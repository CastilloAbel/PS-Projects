import React, { useState } from 'react';
import { Plus, Loader2, FolderOpen, Users, Calendar, ArrowRight, Moon, Sun, Globe, Shield, LogOut, Menu, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { SecurityModal } from './SecurityModal';
import type { Workspace } from '../types';

interface HomePageProps {
  workspaces: Workspace[];
  onSelectWorkspace: (workspace: Workspace) => void;
  onCreateWorkspace: () => void;
  onLogout: () => void;
  loading: boolean;
}

export const HomePage: React.FC<HomePageProps> = ({
  workspaces,
  onSelectWorkspace,
  onCreateWorkspace,
  onLogout,
  loading,
}) => {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage } = useLanguage();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);

  const filteredWorkspaces = workspaces.filter((ws) =>
    ws.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ws.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950">
      {/* Header/Navigation */}
      <header className="glass border-b border-surface-200 dark:border-surface-700 shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center font-bold text-white">
                PS
              </div>
              <div>
                <h1 className="font-bold text-lg text-surface-900 dark:text-surface-50">Pirate Ship</h1>
                <p className="text-xs text-surface-500 dark:text-surface-400">Project Manager</p>
              </div>
            </div>

            {/* Desktop Controls */}
            <div className="hidden md:flex items-center gap-4">
              {/* User Info */}
              <div className="flex items-center gap-3 px-4 py-2 bg-surface-100 dark:bg-surface-800 rounded-lg">
                <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  {(user?.name?.charAt(0) || user?.email?.charAt(0) || 'U').toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-surface-900 dark:text-surface-50 truncate">
                    {user?.name || user?.email || 'User'}
                  </p>
                  <p className="text-xs text-surface-500 dark:text-surface-400">Admin</p>
                </div>
              </div>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors"
                title="Toggle dark/light mode"
              >
                {theme === 'light' ? (
                  <Moon className="w-5 h-5 text-surface-600" />
                ) : (
                  <Sun className="w-5 h-5 text-surface-400" />
                )}
              </button>

              {/* Language Toggle */}
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-2 px-3 py-2 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors text-surface-700 dark:text-surface-300 text-sm font-medium"
              >
                <Globe className="w-4 h-4" />
                <span>{language === 'es' ? 'EN' : 'ES'}</span>
              </button>

              {/* Security/Settings */}
              <button
                onClick={() => setShowSecurityModal(true)}
                className="flex items-center gap-2 px-3 py-2 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors text-surface-700 dark:text-surface-300"
                title="Security Settings"
              >
                <Shield className="w-5 h-5" />
                <span className="text-sm">Security</span>
              </button>

              {/* Logout */}
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-3 py-2 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg transition-colors text-red-600 dark:text-red-400"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm">Logout</span>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden pb-4 space-y-2 border-t border-surface-200 dark:border-surface-700 pt-4">
              <div className="flex items-center gap-3 px-4 py-2 bg-surface-100 dark:bg-surface-800 rounded-lg mb-4">
                <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  {(user?.name?.charAt(0) || user?.email?.charAt(0) || 'U').toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-surface-900 dark:text-surface-50 truncate">
                    {user?.name || user?.email || 'User'}
                  </p>
                  <p className="text-xs text-surface-500 dark:text-surface-400">Admin</p>
                </div>
              </div>

              <button
                onClick={() => {
                  toggleTheme();
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors text-surface-700 dark:text-surface-300"
              >
                {theme === 'light' ? (
                  <>
                    <Moon className="w-5 h-5" />
                    <span>Dark Mode</span>
                  </>
                ) : (
                  <>
                    <Sun className="w-5 h-5" />
                    <span>Light Mode</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  toggleLanguage();
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors text-surface-700 dark:text-surface-300"
              >
                <Globe className="w-5 h-5" />
                <span>{language === 'es' ? 'English' : 'Español'}</span>
              </button>

              <button className="w-full flex items-center gap-3 px-4 py-2 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors text-surface-700 dark:text-surface-300">
                <Shield className="w-5 h-5" />
                <span>Security</span>
              </button>

              <button
                onClick={() => {
                  onLogout();
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg transition-colors text-red-600 dark:text-red-400"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 px-6 py-12 sm:py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Welcome back, {user?.name?.split(' ')[0] || 'User'}!
          </h2>
          <p className="text-primary-100 text-lg mb-8">
            Manage your projects and collaborate with your team efficiently
          </p>

          {/* Search Bar */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search workspaces..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-50 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-white"
              />
            </div>
            <button
              onClick={onCreateWorkspace}
              className="px-6 py-3 bg-white dark:bg-surface-700 text-primary-600 dark:text-primary-400 rounded-lg font-semibold hover:bg-primary-50 dark:hover:bg-surface-600 transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <Plus className="w-5 h-5" />
              <span>New Workspace</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-primary-500 mb-4" />
            <p className="text-surface-600 dark:text-surface-400">Loading workspaces...</p>
          </div>
        ) : filteredWorkspaces.length === 0 ? (
          <div className="text-center py-20">
            <FolderOpen className="w-16 h-16 text-surface-300 dark:text-surface-700 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-surface-900 dark:text-surface-50 mb-2">
              No Workspaces Yet
            </h2>
            <p className="text-surface-600 dark:text-surface-400 mb-8">
              Create your first workspace to get started
            </p>
            <button
              onClick={onCreateWorkspace}
              className="px-6 py-3 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Workspace
            </button>
          </div>
        ) : (
          <>
            {/* My Workspaces Section */}
            <div>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-surface-900 dark:text-surface-50 mb-2">
                  My Workspaces
                </h2>
                <p className="text-surface-600 dark:text-surface-400">
                  {filteredWorkspaces.length} workspace{filteredWorkspaces.length !== 1 ? 's' : ''}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredWorkspaces.map((workspace) => (
                  <div
                    key={workspace.id}
                    onClick={() => onSelectWorkspace(workspace)}
                    className="group cursor-pointer"
                  >
                    <div className="h-full bg-surface-100 dark:bg-surface-800 rounded-lg p-6 hover:shadow-lg dark:hover:shadow-lg transition-all duration-300 border border-surface-200 dark:border-surface-700 hover:border-primary-500 dark:hover:border-primary-500">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-surface-900 dark:text-surface-50 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                            {workspace.name}
                          </h3>
                          {workspace.description && (
                            <p className="text-sm text-surface-600 dark:text-surface-400 mt-1 line-clamp-2">
                              {workspace.description}
                            </p>
                          )}
                        </div>
                        <FolderOpen className="w-8 h-8 text-primary-500 flex-shrink-0" />
                      </div>

                      {/* Divider */}
                      <div className="border-t border-surface-200 dark:border-surface-700 my-4" />

                      {/* Stats */}
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
                          <FolderOpen className="w-4 h-4" />
                          <span>
                            {workspace.boards?.length || 0} board{(workspace.boards?.length || 0) !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
                          <Users className="w-4 h-4" />
                          <span>
                            {workspace.members?.length || 0} member{(workspace.members?.length || 0) !== 1 ? 's' : ''}
                          </span>
                        </div>
                        {workspace.createdAt && (
                          <div className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
                            <Calendar className="w-4 h-4" />
                            <span>
                              Created {new Date(workspace.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Divider */}
                      <div className="border-t border-surface-200 dark:border-surface-700 my-4" />

                      {/* Boards Preview */}
                      {workspace.boards && workspace.boards.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs font-semibold text-surface-700 dark:text-surface-300 mb-2">
                            Boards
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {workspace.boards.slice(0, 2).map((board) => (
                              <span
                                key={board.id}
                                className="text-xs px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-900 dark:text-primary-100 rounded"
                              >
                                {board.name}
                              </span>
                            ))}
                            {workspace.boards.length > 2 && (
                              <span className="text-xs px-2 py-1 bg-surface-200 dark:bg-surface-700 text-surface-700 dark:text-surface-300 rounded">
                                +{workspace.boards.length - 2} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* CTA */}
                      <button className="w-full mt-4 py-2 px-4 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 group/btn">
                        <span>Open Workspace</span>
                        <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Create CTA */}
            <div className="mt-16 text-center">
              <button
                onClick={onCreateWorkspace}
                className="px-8 py-3 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-colors inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create Another Workspace
              </button>
            </div>
          </>
        )}
      </div>

      {/* Security Modal */}
      {showSecurityModal && (
        <SecurityModal
          isOpen={showSecurityModal}
          userName={user?.name || user?.email || 'User'}
          onClose={() => setShowSecurityModal(false)}
        />
      )}
    </div>
  );
};
