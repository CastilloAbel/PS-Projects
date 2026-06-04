import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

interface AcceptInvitationState {
  loading: boolean;
  error: string | null;
  success: boolean;
  workspaceName: string | null;
}

export const AcceptInvitation: React.FC = () => {
  // Extract token from URL path
  const token = window.location.pathname.split('/accept-invitation/')[1];
  const { theme } = useTheme();
  const { user } = useAuth();
  const [state, setState] = useState<AcceptInvitationState>({
    loading: true,
    error: null,
    success: false,
    workspaceName: null,
  });

  useEffect(() => {
    // If user is not logged in, redirect to login
    if (!user) {
      // Store the token in sessionStorage for after login
      if (token) {
        sessionStorage.setItem('invitationToken', token);
      }
      window.location.href = `/login`;
      return;
    }

    acceptInvitation();
  }, [user, token]);

  const acceptInvitation = async () => {
    if (!token || !user) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/invitations/${token}/accept`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to accept invitation');
      }

      setState(prev => ({
        ...prev,
        success: true,
        workspaceName: data.data?.board?.name 
          ? `board "${data.data.board.name}"` 
          : (data.data?.workspace?.name || 'Workspace'),
      }));

      // Redirect to workspace after 2 seconds
      setTimeout(() => {
        window.location.href = `/workspaces/${data.data.workspaceId}`;
      }, 2000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to accept invitation';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        loading: false,
      }));
    }
  };

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${theme === 'dark' ? 'bg-surface-950' : 'bg-surface-50'}`}>
      <div className={`rounded-lg shadow-lg max-w-md w-full p-8 ${theme === 'dark' ? 'bg-surface-900 border-surface-700' : 'bg-white border-surface-200'} border`}>
        {state.loading && (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
            </div>
            <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-surface-50' : 'text-surface-900'}`}>
              Processing Invitation
            </h1>
            <p className={`${theme === 'dark' ? 'text-surface-400' : 'text-surface-500'}`}>
              Please wait while we confirm your invitation...
            </p>
          </div>
        )}

        {state.success && (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-surface-50' : 'text-surface-900'}`}>
              Invitation Accepted!
            </h1>
            <p className={`${theme === 'dark' ? 'text-surface-400' : 'text-surface-500'}`}>
              You've successfully joined{state.workspaceName ? ` ${state.workspaceName}` : ' the workspace'}.
            </p>
            <p className={`text-sm ${theme === 'dark' ? 'text-surface-500' : 'text-surface-400'}`}>
              Redirecting you now...
            </p>
          </div>
        )}

        {state.error && (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <AlertCircle className="w-12 h-12 text-red-500" />
            </div>
            <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-surface-50' : 'text-surface-900'}`}>
              Invitation Error
            </h1>
            <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'}`}>
              <p className={`text-sm ${theme === 'dark' ? 'text-red-100' : 'text-red-700'}`}>
                {state.error}
              </p>
            </div>
            <div className="space-y-2 pt-4">
              <button
                onClick={() => {window.location.href = '/workspaces';}}
                className="w-full px-4 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
              >
                Go to Workspaces
              </button>
              <button
                onClick={() => window.location.reload()}
                className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                  theme === 'dark'
                    ? 'bg-surface-800 text-surface-100 hover:bg-surface-700'
                    : 'bg-surface-200 text-surface-900 hover:bg-surface-300'
                }`}
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
