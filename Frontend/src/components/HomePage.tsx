import React, { useState } from 'react';
import { Plus, Loader2, FolderOpen, Users, Calendar, ArrowRight } from 'lucide-react';
import type { Workspace } from '../types';

interface HomePageProps {
  workspaces: Workspace[];
  onSelectWorkspace: (workspace: Workspace) => void;
  onCreateWorkspace: () => void;
  loading: boolean;
}

export const HomePage: React.FC<HomePageProps> = ({
  workspaces,
  onSelectWorkspace,
  onCreateWorkspace,
  loading,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredWorkspaces = workspaces.filter((ws) =>
    ws.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ws.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 pb-20">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 px-6 py-12 sm:py-16">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Welcome to Pirate Ship
          </h1>
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
                    <div className="h-full bg-surface-100 dark:bg-surface-800 rounded-lg p-6 hover:shadow-lg dark:hover:shadow-lg transition-all duration-300 border border-surface-200 dark:border-surface-700 hover:border-primary-500 dark:hover:border-primary-500"
                    >
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
                            {workspace.workspaceMembers?.length || 0} member{(workspace.workspaceMembers?.length || 0) !== 1 ? 's' : ''}
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
    </div>
  );
};
