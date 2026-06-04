import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { ErrorProvider, useError } from './context/ErrorContext';
import { UserProvider } from './context/UserContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PermissionProvider } from './context/PermissionContext';
import { ErrorModal } from './components/ErrorModal';
import { LoginPage } from './components/LoginPage';
import { AuthCallbackPage } from './components/AuthCallbackPage';
import { HomePage } from './components/HomePage';
import { WorkspaceView } from './components/WorkspaceView';
import { AcceptInvitation } from './components/AcceptInvitation';
import { CreateWorkspaceModal } from './components/CreateWorkspaceModal';
import { fetchWorkspaces, logoutUser, createWorkspace } from './api';
import type { Workspace } from './types';

function AppContent() {
  const { isAuthenticated, isLoading: authLoading, logout, user } = useAuth();
  const { error, clearError } = useError();
  const [currentView, setCurrentView] = useState<'login' | 'callback' | 'invitation' | 'home' | 'workspace'>('home');
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateWorkspaceModal, setShowCreateWorkspaceModal] = useState(false);
  const [creatingWorkspace, setCreatingWorkspace] = useState(false);

  // Detect callback route and invitation route
  useEffect(() => {
    if (window.location.pathname === '/auth/callback') {
      setCurrentView('callback');
    } else if (window.location.pathname.startsWith('/accept-invitation/')) {
      setCurrentView('invitation');
    } else if (window.location.pathname.startsWith('/workspaces/')) {
      setCurrentView('workspace');
    }
  }, []);

  // Load workspaces when authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      if (
        window.location.pathname === '/auth/callback' ||
        window.location.pathname.startsWith('/accept-invitation/')
      ) {
        setLoading(false);
        return;
      }
      setCurrentView('login');
      setLoading(false);
      return;
    }

    const loadWorkspaces = async () => {
      try {
        setLoading(true);
        const ws = await fetchWorkspaces();
        // Ensure all boards have lists array
        const sanitizedWs = ws.map(w => ({
          ...w,
          boards: (w.boards || []).map(b => ({
            ...b,
            lists: b.lists || [],
          })),
        }));
        setWorkspaces(sanitizedWs);
        
        // Check if path has a workspace ID
        const match = window.location.pathname.match(/^\/workspaces\/([^/]+)/);
        const urlWorkspaceId = match ? match[1] : null;
        
        const targetWorkspace = sanitizedWs.find(w => w.id === urlWorkspaceId) || sanitizedWs[0];
        
        // Auto-select workspace if available
        if (targetWorkspace) {
          setSelectedWorkspace(targetWorkspace);
          setCurrentView('workspace');
        } else {
          setCurrentView('home');
        }
      } catch (err) {
        console.error('Error loading workspaces:', err);
        setCurrentView('home');
      } finally {
        setLoading(false);
      }
    };

    loadWorkspaces();
  }, [isAuthenticated]);

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error('Error logging out:', err);
    } finally {
      logout();
      setCurrentView('login');
      setWorkspaces([]);
      setSelectedWorkspace(null);
    }
  };

  const handleCreateWorkspace = () => {
    setShowCreateWorkspaceModal(true);
  };

  const handleSubmitCreateWorkspace = async (name: string, description?: string) => {
    setCreatingWorkspace(true);
    try {
      const newWorkspace = await createWorkspace(name, description);
      // Ensure the new workspace has proper structure
      const sanitizedWs = {
        ...newWorkspace,
        boards: (newWorkspace.boards || []).map(b => ({
          ...b,
          lists: b.lists || [],
        })),
      };
      setWorkspaces([...workspaces, sanitizedWs]);
      setShowCreateWorkspaceModal(false);
      // Optionally auto-select the new workspace
      setSelectedWorkspace(sanitizedWs);
      setCurrentView('workspace');
    } catch (err) {
      console.error('Error creating workspace:', err);
      throw err;
    } finally {
      setCreatingWorkspace(false);
    }
  };

  if (authLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-surface-50 dark:bg-surface-950">
        <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
      </div>
    );
  }

  if (currentView === 'callback') {
    return (
      <>
        <AuthCallbackPage onSuccess={() => setCurrentView('home')} />
        <ErrorModal error={error} onClose={clearError} />
      </>
    );
  }

  if (currentView === 'invitation') {
    return (
      <>
        <AcceptInvitation />
        <ErrorModal error={error} onClose={clearError} />
      </>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <LoginPage onLoginSuccess={() => setCurrentView('home')} />
        <ErrorModal error={error} onClose={clearError} />
      </>
    );
  }

  if (currentView === 'home') {
    return (
      <>
        <HomePage
          workspaces={workspaces}
          onSelectWorkspace={(ws) => {
            setSelectedWorkspace(ws);
            setCurrentView('workspace');
          }}
          onCreateWorkspace={handleCreateWorkspace}
          onLogout={handleLogout}
          loading={loading}
        />
        {showCreateWorkspaceModal && (
          <CreateWorkspaceModal
            isOpen={showCreateWorkspaceModal}
            isLoading={creatingWorkspace}
            onSubmit={handleSubmitCreateWorkspace}
            onClose={() => setShowCreateWorkspaceModal(false)}
          />
        )}
        <ErrorModal error={error} onClose={clearError} />
      </>
    );
  }

  if (currentView === 'workspace' && selectedWorkspace) {
    return (
      <>
        <WorkspaceView
          workspace={selectedWorkspace}
          workspaces={workspaces}
          onWorkspaceSelect={(ws) => {
            setSelectedWorkspace(ws);
          }}
          onCreateWorkspace={handleCreateWorkspace}
          onLogout={handleLogout}
          userName={user?.name || user?.email || 'User'}
        />
        <ErrorModal error={error} onClose={clearError} />
      </>
    );
  }

  return (
    <>
      <div className="h-screen w-full flex items-center justify-center bg-surface-50 dark:bg-surface-950">
        <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
      </div>
      <ErrorModal error={error} onClose={clearError} />
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <UserProvider>
            <PermissionProvider>
              <ErrorProvider>
                <AppContent />
              </ErrorProvider>
            </PermissionProvider>
          </UserProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
