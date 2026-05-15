import { useState, useEffect } from 'react'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import { LanguageProvider, useLanguage } from './context/LanguageContext'
import { ErrorProvider, useError } from './context/ErrorContext'
import { UserProvider } from './context/UserContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { Sun, Moon, LayoutDashboard, Loader2, Globe, Menu, X, LogOut, Shield } from 'lucide-react'
import { Board } from './components/Board'
import { LoginPage } from './components/LoginPage'
import { SecurityPage } from './components/SecurityPage'
import { ErrorModal } from './components/ErrorModal'
import { fetchBoards, logoutUser } from './api'
import type { Board as BoardType } from './types'

function KanbanDemo() {
  const [board, setBoard] = useState<BoardType | null>(null);
  const [loading, setLoading] = useState(true);
  const { t, language } = useLanguage();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    fetchBoards()
      .then(boards => {
        if (boards && boards.length > 0) {
          setBoard(boards[0]);
        } else {
          // Fallback mock board if DB is empty or backend is unreachable
          setBoard({
            id: 'mock-board',
            name: t('mockBoardName'),
            background: null,
            workspaceId: 'mock-ws',
            lists: [
              { id: 'list-1', name: t('todo'), order: 0, boardId: 'mock-board', cards: [
                { id: 'card-1', title: t('mockCard1'), description: '', order: 0, listId: 'list-1', assigneeId: 'user-1' },
                { id: 'card-2', title: t('mockCard2'), description: '', order: 1, listId: 'list-1', assigneeId: 'user-2' }
              ]},
              { id: 'list-2', name: t('inProgress'), order: 1, boardId: 'mock-board', cards: [
                { id: 'card-3', title: t('mockCard3'), description: '', order: 0, listId: 'list-2', assigneeId: 'user-1' }
              ]},
              { id: 'list-3', name: t('done'), order: 2, boardId: 'mock-board', cards: [
                { id: 'card-4', title: t('mockCard4'), description: '', order: 0, listId: 'list-3', assigneeId: 'user-1' }
              ]}
            ]
          });
        }
      })
      .catch(() => {
        // Fallback if backend is down
        setBoard({
          id: 'mock-board',
          name: t('mockOfflineName'),
          background: null,
          workspaceId: 'mock-ws',
          lists: [
            { id: 'list-1', name: t('todo'), order: 0, boardId: 'mock-board', cards: [
              { id: 'card-1', title: t('mockCheckServer'), description: '', order: 0, listId: 'list-1', assigneeId: 'user-1' }
            ]}
          ]
        });
      })
      .finally(() => setLoading(false));
  }, [language, t, isAuthenticated]); // Reacting to language changes and auth status

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-surface-500">
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-primary-500" />
        <p>{t('loading')}</p>
      </div>
    );
  }

  return board ? <Board initialBoard={board} onBoardUpdate={() => {}} /> : null;
}

function AppContent() {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const { error, clearError } = useError();
  const { isAuthenticated, logout, isLoading: authLoading } = useAuth();
  const [currentView, setCurrentView] = useState<'home' | 'board' | 'security'>('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      logout();
    }
  };

  if (authLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-surface-50 dark:bg-surface-950">
        <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <LoginPage onLoginSuccess={() => setCurrentView('board')} />
        <ErrorModal error={error} onClose={clearError} />
      </>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col bg-surface-50 dark:bg-surface-950 transition-colors duration-300">
      <header className="glass border-b border-surface-200 dark:border-surface-700 shadow-sm z-20 sticky top-0 relative">
        <div className="flex justify-between items-center px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-3 cursor-pointer" onClick={() => setCurrentView('home')}>
            <h1 className="font-bold text-xl sm:text-2xl gradient-text">PS</h1>
            <p className="text-xs sm:text-sm text-surface-500 dark:text-surface-400 font-medium">{t('appTitle')}</p>
          </div>
          
          {/* Menú Desktop */}
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={() => setCurrentView(currentView === 'home' ? 'board' : 'home')}
              className="flex items-center gap-2 btn-secondary text-base px-4 py-2"
            >
              <LayoutDashboard size={18} />
              <span>
                {currentView === 'home' ? t('viewDemo') : t('backHome')}
              </span>
            </button>
            <div className="flex items-center gap-2 border-l pl-4 border-surface-200 dark:border-surface-700">
              <button
                onClick={() => setCurrentView('security')}
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors"
                aria-label="Security Settings"
                title="Configuración de seguridad"
              >
                <Shield size={16} />
                <span className="hidden sm:inline">Seguridad</span>
              </button>
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors"
                aria-label="Toggle Language"
              >
                <Globe size={16} />
                <span>{language === 'es' ? 'EN' : 'ES'}</span>
              </button>
              <button
                onClick={toggleTheme}
                className="p-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
                aria-label="Toggle Theme"
              >
                {theme === 'light' ? (
                  <Moon size={20} className="text-surface-600" />
                ) : (
                  <Sun size={20} className="text-surface-300" />
                )}
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors"
                aria-label="Logout"
              >
                <LogOut size={16} />
                <span>Salir</span>
              </button>
            </div>
          </div>

          {/* Botón Menú Mobile (Hamburguesa) */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Desplegable Menú Mobile */}
        {isMenuOpen && (
          <div className="absolute top-full left-0 w-full glass border-b border-surface-200 dark:border-surface-700 shadow-md md:hidden flex flex-col p-4 gap-3 animate-in slide-in-from-top-2">
            <button
              onClick={() => {
                setCurrentView(currentView === 'home' ? 'board' : 'home');
                setIsMenuOpen(false);
              }}
              className="flex items-center justify-center gap-2 btn-secondary text-sm w-full py-2.5"
            >
              <LayoutDashboard size={18} />
              <span>
                {currentView === 'home' ? t('viewDemo') : t('backHome')}
              </span>
            </button>
            <div className="flex items-center justify-center gap-4 pt-3 border-t border-surface-200 dark:border-surface-700">
              <button
                onClick={() => {
                  setCurrentView('security');
                  setIsMenuOpen(false);
                }}
                className="flex flex-1 justify-center items-center gap-2 px-3 py-2 text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors"
              >
                <Shield size={18} />
                <span>Seguridad</span>
              </button>
              <button
                onClick={() => {
                  toggleLanguage();
                  setIsMenuOpen(false);
                }}
                className="flex flex-1 justify-center items-center gap-2 px-3 py-2 text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors"
              >
                <Globe size={18} />
                <span>{language === 'es' ? 'English' : 'Español'}</span>
              </button>
              <button
                onClick={() => {
                  toggleTheme();
                  setIsMenuOpen(false);
                }}
                className="flex flex-1 justify-center items-center gap-2 px-3 py-2 text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors"
              >
                {theme === 'light' ? (
                  <><Moon size={18} /> Modo Oscuro</>
                ) : (
                  <><Sun size={18} /> Modo Claro</>
                )}
              </button>
              <button
                onClick={() => {
                  handleLogout();
                  setIsMenuOpen(false);
                }}
                className="flex flex-1 justify-center items-center gap-2 px-3 py-2 text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors"
              >
                <LogOut size={18} /> Salir
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 overflow-hidden bg-surface-50 dark:bg-surface-950 flex flex-col">
        {currentView === 'home' ? (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center p-4 sm:p-8 max-w-2xl mx-auto">
              <h2 className="text-3xl sm:text-5xl font-bold text-surface-900 dark:text-surface-50 mb-4 sm:mb-6 gradient-text">{t('welcome')}</h2>
              <p className="text-lg sm:text-xl text-surface-600 dark:text-surface-400 mb-6 sm:mb-8">{t('subtitle')}</p>
              
              <button 
                onClick={() => setCurrentView('board')}
                className="btn-primary text-base sm:text-lg px-6 py-3 sm:px-8 sm:py-3 card-hover shadow-md w-full sm:w-auto"
              >
                {t('tryDemo')}
              </button>

              <p className="text-xs sm:text-sm text-surface-400 dark:text-surface-500 mt-6 sm:mt-8 px-4">{t('backendWarning')}</p>
            </div>
          </div>
        ) : currentView === 'board' ? (
          <KanbanDemo />
        ) : (
          <SecurityPage onClose={() => setCurrentView('home')} />
        )}
      </main>
      
      <ErrorModal error={error} onClose={clearError} />
    </div>
  )
}

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <UserProvider>
            <ErrorProvider>
              <AppContent />
            </ErrorProvider>
          </UserProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  )
}

export default App
