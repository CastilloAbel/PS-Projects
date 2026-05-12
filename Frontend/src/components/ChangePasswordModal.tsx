import React, { useState } from 'react';
import { X, Lock, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useError } from '../context/ErrorContext';
import { changePassword } from '../api';

interface ChangePasswordModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ onClose, onSuccess }) => {
  const { theme } = useTheme();
  const { showError } = useError();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
        onSuccess();
        onClose();
      }, 2000);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || 'Error al cambiar la contraseña';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const bgClass = theme === 'dark' ? 'bg-surface-800 border-surface-700' : 'bg-white border-surface-200';
  const textClass = theme === 'dark' ? 'text-surface-50' : 'text-surface-900';
  const labelClass = theme === 'dark' ? 'text-surface-400' : 'text-surface-500';
  const inputClass = theme === 'dark'
    ? 'bg-surface-900 border-surface-700 text-surface-50 focus:border-primary-500 placeholder-surface-500'
    : 'bg-surface-50 border-surface-200 text-surface-900 focus:border-primary-500 placeholder-surface-400';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`${bgClass} w-full max-w-md rounded-xl shadow-2xl border p-6 sm:p-8 flex flex-col animate-in fade-in zoom-in-95 duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-primary-900' : 'bg-primary-100'}`}>
              <Lock size={20} className="text-primary-600 dark:text-primary-400" />
            </div>
            <h2 className={`text-xl sm:text-2xl font-bold ${textClass}`}>
              Cambiar Contraseña
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 sm:p-2 rounded-full hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
          >
            <X size={20} className={labelClass} />
          </button>
        </div>

        {/* Success State */}
        {success ? (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <CheckCircle size={48} className="text-green-500" />
            </div>
            <p className={`text-lg font-semibold ${textClass}`}>
              ¡Contraseña actualizada exitosamente!
            </p>
            <p className={`text-sm ${labelClass}`}>
              Cerrando en unos momentos...
            </p>
          </div>
        ) : (
          // Form
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleChangePassword();
            }}
            className="space-y-4 flex-1"
          >
            {/* Current Password */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${labelClass}`}>
                Contraseña Actual
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full px-4 py-3 rounded-lg border outline-none transition-colors ${inputClass}`}
                disabled={isLoading}
                required
              />
            </div>

            {/* New Password */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${labelClass}`}>
                Nueva Contraseña
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full px-4 py-3 rounded-lg border outline-none transition-colors ${inputClass}`}
                disabled={isLoading}
                required
              />
              <p className={`text-xs ${labelClass} mt-1`}>
                Mínimo 8 caracteres
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${labelClass}`}>
                Confirmar Contraseña
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full px-4 py-3 rounded-lg border outline-none transition-colors ${inputClass}`}
                disabled={isLoading}
                required
              />
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

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="btn-secondary flex-1 py-2 sm:py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary flex-1 py-2 sm:py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  <>
                    <Lock size={18} />
                    Cambiar
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
