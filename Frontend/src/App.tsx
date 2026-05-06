import { ThemeProvider, useTheme } from './context/ThemeContext'
import { Sun, Moon } from 'lucide-react'

function AppContent() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="h-screen w-full flex flex-col bg-surface-50 dark:bg-surface-950 transition-colors duration-300">
      <header className="bg-white dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700 shadow-sm">
        <div className="flex justify-between items-center px-6 py-4">
          <div className="flex items-center gap-3">
            <h1 className="font-bold text-2xl text-primary-600 dark:text-primary-400">PS</h1>
            <p className="text-sm text-surface-500 dark:text-surface-400">Project Manager</p>
          </div>
          <button
            onClick={toggleTheme}
            className="p-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
          >
            {theme === 'light' ? (
              <Moon size={20} className="text-surface-600" />
            ) : (
              <Sun size={20} className="text-surface-300" />
            )}
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden bg-surface-50 dark:bg-surface-950 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-surface-900 dark:text-surface-50 mb-4">Bienvenido a PS</h2>
          <p className="text-lg text-surface-500 dark:text-surface-400">Gestor de Proyectos Profesional</p>
          <p className="text-sm text-surface-400 dark:text-surface-500 mt-4">Asegúrate de que el Backend esté corriendo en puerto 4000</p>
        </div>
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
