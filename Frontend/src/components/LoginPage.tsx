import React, { useState } from 'react';
import { LogIn, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
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
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { user } = await api.post('/auth/login', { email, password }).then(r => r.data);
      login(user);
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
              placeholder="tu@email.com"
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
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full px-4 py-3 rounded-lg border outline-none transition-colors pr-12 ${inputClass}`}
                disabled={isLoading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded transition-colors ${
                  theme === 'dark'
                    ? 'hover:bg-surface-700 text-surface-400 hover:text-surface-200'
                    : 'hover:bg-surface-100 text-surface-500 hover:text-surface-700'
                } disabled:cursor-not-allowed`}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
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
      </div>
    </div>
  );
};
