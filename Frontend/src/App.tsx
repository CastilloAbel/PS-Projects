import { useState, useEffect } from 'react'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import { Sun, Moon, LayoutDashboard, Loader2 } from 'lucide-react'
import { Board } from './components/Board'
import { fetchBoards } from './api'
import type { Board as BoardType } from './types'

function KanbanDemo() {
  const [board, setBoard] = useState<BoardType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBoards()
      .then(boards => {
        if (boards && boards.length > 0) {
          setBoard(boards[0]);
        } else {
          // Fallback mock board if DB is empty or backend is unreachable
          setBoard({
            id: 'mock-board',
            name: 'Proyecto Demo',
            background: null,
            workspaceId: 'mock-ws',
            lists: [
              { id: 'list-1', name: 'To Do', order: 0, boardId: 'mock-board', cards: [
                { id: 'card-1', title: 'Planificar arquitectura base de datos', description: '', order: 0, listId: 'list-1', assigneeId: 'user-1' },
                { id: 'card-2', title: 'Configurar variables de entorno', description: '', order: 1, listId: 'list-1', assigneeId: 'user-2' }
              ]},
              { id: 'list-2', name: 'In Progress', order: 1, boardId: 'mock-board', cards: [
                { id: 'card-3', title: 'Implementar drag & drop de columnas', description: '', order: 0, listId: 'list-2', assigneeId: 'user-1' }
              ]},
              { id: 'list-3', name: 'Done', order: 2, boardId: 'mock-board', cards: [
                { id: 'card-4', title: 'Modo oscuro', description: '', order: 0, listId: 'list-3', assigneeId: 'user-1' }
              ]}
            ]
          });
        }
      })
      .catch(() => {
        // Fallback if backend is down
        setBoard({
          id: 'mock-board',
          name: 'Proyecto Demo (Offline)',
          background: null,
          workspaceId: 'mock-ws',
          lists: [
            { id: 'list-1', name: 'To Do', order: 0, boardId: 'mock-board', cards: [
              { id: 'card-1', title: 'Revisar conexión al servidor', description: '', order: 0, listId: 'list-1', assigneeId: 'user-1' }
            ]}
          ]
        });
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-surface-500">
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-primary-500" />
        <p>Cargando tablero...</p>
      </div>
    );
  }

  return board ? <Board initialBoard={board} onBoardUpdate={() => {}} /> : null;
}

function AppContent() {
  const { theme, toggleTheme } = useTheme();
  const [currentView, setCurrentView] = useState<'home' | 'board'>('home');

  return (
    <div className="h-screen w-full flex flex-col bg-surface-50 dark:bg-surface-950 transition-colors duration-300">
      <header className="glass border-b border-surface-200 dark:border-surface-700 shadow-sm z-10 sticky top-0">
        <div className="flex justify-between items-center px-6 py-4">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentView('home')}>
            <h1 className="font-bold text-2xl gradient-text">PS</h1>
            <p className="text-sm text-surface-500 dark:text-surface-400 hidden sm:block font-medium">Project Manager</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentView(currentView === 'home' ? 'board' : 'home')}
              className="flex items-center gap-2 btn-secondary"
            >
              <LayoutDashboard size={18} />
              <span className="hidden sm:inline">
                {currentView === 'home' ? 'Ver Tablero Demo' : 'Volver al Inicio'}
              </span>
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
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden bg-surface-50 dark:bg-surface-950 flex flex-col">
        {currentView === 'home' ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center p-8 max-w-2xl mx-auto">
              <h2 className="text-5xl font-bold text-surface-900 dark:text-surface-50 mb-6 gradient-text">Bienvenido a PS</h2>
              <p className="text-xl text-surface-600 dark:text-surface-400 mb-8">Gestor de Proyectos Profesional. Colaborativo, intuitivo y adaptado para equipos ágiles.</p>
              
              <button 
                onClick={() => setCurrentView('board')}
                className="btn-primary text-lg px-8 py-3 card-hover shadow-md"
              >
                Probar Demo Kanban
              </button>

              <p className="text-sm text-surface-400 dark:text-surface-500 mt-8">Asegúrate de que el Backend esté corriendo en puerto 4000 para sincronización en tiempo real.</p>
            </div>
          </div>
        ) : (
          <KanbanDemo />
        )}
      </main>
    </div>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  )
}

export default App
