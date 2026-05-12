import React, { useState } from 'react';
import { LogIn, AlertCircle, Loader2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useError } from '../context/ErrorContext';
import { api } from '../api';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { theme } = useTheme();
  const { login } = useAuth();
  const { showError } = useError();
  
  const [email, setEmail] = useState('admin@ps-project.local');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;

      login(token, user);
      onLoginSuccess();
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || 'Error al iniciar sesión';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const bgClass = theme === 'dark' ? 'bg-surface-950' : 'bg-gradient-to-br from-primary-50 to-surface-50';
  const textClass = theme === 'dark' ? 'text-surface-50' : 'text-surface-900';
  const labelClass = theme === 'dark' ? 'text-surface-400' : 'text-surface-500';
  const inputClass = theme === 'dark'
    ? 'bg-surface-900 border-surface-700 text-surface-50 focus:border-primary-500 placeholder-surface-500'
    : 'bg-white border-surface-200 text-surface-900 focus:border-primary-500 placeholder-surface-400';
  const cardClass = theme === 'dark' ? 'bg-surface-900 border-surface-700' : 'bg-white border-surface-200';

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${bgClass}`}>
      <div className={`w-full max-w-md rounded-xl shadow-2xl border p-8 sm:p-10 ${cardClass}`}>
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <h1 className="text-4xl font-bold gradient-text">PS</h1>
          <div>
            <p className="text-lg font-bold text-surface-900 dark:text-surface-50">Pirate Ship</p>
            <p className={`text-xs ${labelClass}`}>Project Management</p>
          </div>
        </div>

        {/* Title */}
        <h2 className={`text-2xl sm:text-3xl font-bold text-center mb-2 ${textClass}`}>
          Iniciar Sesión
        </h2>
        <p className={`text-center text-sm ${labelClass} mb-6`}>
          Ingresa tus credenciales para acceder
        </p>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${labelClass}`}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@ps-project.local"
              className={`w-full px-4 py-3 rounded-lg border outline-none transition-colors ${inputClass}`}
              disabled={isLoading}
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${labelClass}`}>
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={`w-full px-4 py-3 rounded-lg border outline-none transition-colors ${inputClass}`}
              disabled={isLoading}
              required
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className={`flex items-center gap-2 p-3 rounded-lg ${theme === 'dark' ? 'bg-red-900/20 border border-red-700' : 'bg-red-50 border border-red-200'}`}>
              <AlertCircle size={16} className={`${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`} />
              <p className={`text-sm ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>
                {error}
              </p>
            </div>
          )}

          {/* Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary py-3 flex items-center justify-center gap-2 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Iniciando sesión...
              </>
            ) : (
              <>
                <LogIn size={18} />
                Iniciar Sesión
              </>
            )}
          </button>
        </form>

        {/* Demo Info */}
        <div className={`mt-6 p-4 rounded-lg ${theme === 'dark' ? 'bg-blue-900/20 border border-blue-700' : 'bg-blue-50 border border-blue-200'}`}>
          <p className={`text-xs sm:text-sm font-medium ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'} mb-2`}>
            Credenciales de Demostración:
          </p>
          <p className={`text-xs ${labelClass} font-mono`}>
            Email: <span className={theme === 'dark' ? 'text-blue-300' : 'text-blue-600'}>admin@ps-project.local</span>
          </p>
          <p className={`text-xs ${labelClass} font-mono`}>
            Password: <span className={theme === 'dark' ? 'text-blue-300' : 'text-blue-600'}>ps-project-admin</span>
          </p>
        </div>
      </div>
    </div>
  );
};
