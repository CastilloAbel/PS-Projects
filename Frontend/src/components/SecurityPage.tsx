import React, { useState } from 'react';
import { X, Lock, Shield, AlertCircle, CheckCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useError } from '../context/ErrorContext';
import { changePassword } from '../api';

interface SecurityPageProps {
  onClose: () => void;
}

export const SecurityPage: React.FC<SecurityPageProps> = ({ onClose }) => {
  const { theme } = useTheme();
  const { showError } = useError();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validatePasswords = (): string | null => {
    if (!currentPassword.trim()) {
      return 'La contraseña actual es requerida';
    }
    if (!newPassword.trim()) {
      return 'La nueva contraseña es requerida';
    }
    if (newPassword.length < 8) {
      return 'La contraseña debe tener al menos 8 caracteres';
    }
    if (newPassword !== confirmPassword) {
      return 'Las contraseñas no coinciden';
    }
    if (currentPassword === newPassword) {
      return 'La nueva contraseña debe ser diferente a la actual';
    }
    return null;
  };

  const handleChangePassword = async () => {
    setError(null);
    
    const validationError = validatePasswords();
    if (validationError) {
      setError(validationError);
      showError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      await changePassword(currentPassword, newPassword);
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || 'Error al cambiar la contraseña';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const bgClass = theme === 'dark' ? 'bg-surface-900 border-surface-700' : 'bg-white border-surface-200';
  const textClass = theme === 'dark' ? 'text-surface-50' : 'text-surface-900';
  const labelClass = theme === 'dark' ? 'text-surface-400' : 'text-surface-500';
  const inputClass = theme === 'dark'
    ? 'bg-surface-800 border-surface-700 text-surface-50 focus:border-primary-500 placeholder-surface-500'
    : 'bg-surface-50 border-surface-200 text-surface-900 focus:border-primary-500 placeholder-surface-400';

  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <div className={`sticky top-0 z-10 border-b ${bgClass} px-6 py-4 sm:py-6 flex justify-between items-center`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-primary-900' : 'bg-primary-100'}`}>
            <Shield size={20} className="text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h2 className={`text-xl sm:text-2xl font-bold ${textClass}`}>Seguridad</h2>
            <p className={`text-xs sm:text-sm ${labelClass}`}>Administra tu contraseña y configuración de seguridad</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 sm:p-2 rounded-full hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
        >
          <X size={20} className={labelClass} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6 space-y-6">
        {/* Change Password Section */}
        <div className={`rounded-xl border ${bgClass} overflow-hidden`}>
          {/* Section Header */}
          <div className={`px-4 sm:px-6 py-3 sm:py-4 border-b ${theme === 'dark' ? 'border-surface-700 bg-surface-800/50' : 'border-surface-200 bg-surface-50'} flex items-center gap-2`}>
            <Lock size={18} className="text-primary-600 dark:text-primary-400" />
            <h3 className={`font-semibold ${textClass}`}>Cambiar Contraseña</h3>
          </div>

          {/* Section Content */}
          <div className="p-4 sm:p-6 space-y-4">
            {success ? (
              <div className="text-center space-y-3 py-6">
                <CheckCircle size={40} className="text-green-500 mx-auto" />
                <p className={`text-sm font-semibold ${textClass}`}>
                  ¡Contraseña actualizada exitosamente!
                </p>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleChangePassword();
                }}
                className="space-y-4"
              >
                {/* Current Password */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${labelClass}`}>
                    Contraseña Actual
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full px-4 py-3 rounded-lg border outline-none transition-colors pr-12 ${inputClass}`}
                      disabled={isLoading}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      disabled={isLoading}
                      className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded transition-colors ${
                        theme === 'dark'
                          ? 'hover:bg-surface-700 text-surface-400 hover:text-surface-200'
                          : 'hover:bg-surface-100 text-surface-500 hover:text-surface-700'
                      } disabled:cursor-not-allowed`}
                    >
                      {showCurrentPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${labelClass}`}>
                    Nueva Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full px-4 py-3 rounded-lg border outline-none transition-colors pr-12 ${inputClass}`}
                      disabled={isLoading}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      disabled={isLoading}
                      className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded transition-colors ${
                        theme === 'dark'
                          ? 'hover:bg-surface-700 text-surface-400 hover:text-surface-200'
                          : 'hover:bg-surface-100 text-surface-500 hover:text-surface-700'
                      } disabled:cursor-not-allowed`}
                    >
                      {showNewPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  </div>
                  <p className={`text-xs ${labelClass} mt-1`}>
                    Mínimo 8 caracteres
                  </p>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${labelClass}`}>
                    Confirmar Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full px-4 py-3 rounded-lg border outline-none transition-colors pr-12 ${inputClass}`}
                      disabled={isLoading}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={isLoading}
                      className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded transition-colors ${
                        theme === 'dark'
                          ? 'hover:bg-surface-700 text-surface-400 hover:text-surface-200'
                          : 'hover:bg-surface-100 text-surface-500 hover:text-surface-700'
                      } disabled:cursor-not-allowed`}
                    >
                      {showConfirmPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div
                    className={`flex items-center gap-2 p-3 rounded-lg ${
                      theme === 'dark' ? 'bg-red-900/20 border border-red-700' : 'bg-red-50 border border-red-200'
                    }`}
                  >
                    <AlertCircle size={16} className={`${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`} />
                    <p className={`text-sm ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>
                      {error}
                    </p>
                  </div>
                )}

                {/* Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Actualizando...
                    </>
                  ) : (
                    <>
                      <Lock size={18} />
                      Cambiar Contraseña
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Future sections */}
        <div className={`rounded-xl border ${bgClass} overflow-hidden opacity-50 cursor-not-allowed`}>
          <div className={`px-4 sm:px-6 py-3 sm:py-4 border-b ${theme === 'dark' ? 'border-surface-700 bg-surface-800/50' : 'border-surface-200 bg-surface-50'} flex items-center gap-2`}>
            <Lock size={18} className="text-gray-400" />
            <h3 className={`font-semibold ${textClass}`}>OAuth (Próximamente)</h3>
          </div>
          <div className="p-4 sm:p-6">
            <p className={`text-sm ${labelClass}`}>
              Conecta con Google, GitHub u otros proveedores de identidad.
            </p>
          </div>
        </div>

        <div className={`rounded-xl border ${bgClass} overflow-hidden opacity-50 cursor-not-allowed`}>
          <div className={`px-4 sm:px-6 py-3 sm:py-4 border-b ${theme === 'dark' ? 'border-surface-700 bg-surface-800/50' : 'border-surface-200 bg-surface-50'} flex items-center gap-2`}>
            <Lock size={18} className="text-gray-400" />
            <h3 className={`font-semibold ${textClass}`}>LDAP (Próximamente)</h3>
          </div>
          <div className="p-4 sm:p-6">
            <p className={`text-sm ${labelClass}`}>
              Integración con directorio LDAP para empresas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
