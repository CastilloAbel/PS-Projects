import React from 'react';
import { X, Lock, Shield, AlertCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface SecurityModalProps {
  isOpen: boolean;
  userName: string;
  onClose: () => void;
}

export const SecurityModal: React.FC<SecurityModalProps> = ({
  isOpen,
  userName,
  onClose,
}) => {
  const { theme } = useTheme();

  if (!isOpen) return null;

  const bgClass = theme === 'dark' ? 'bg-surface-900' : 'bg-white';
  const textClass = theme === 'dark' ? 'text-surface-50' : 'text-surface-900';
  const labelClass = theme === 'dark' ? 'text-surface-400' : 'text-surface-500';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`rounded-lg shadow-lg p-6 w-full max-w-2xl border ${bgClass} ${theme === 'dark' ? 'border-surface-700' : 'border-surface-200'}`}>
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-primary-500" />
            <h2 className={`text-2xl font-bold ${textClass}`}>Security Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-surface-200 dark:hover:bg-surface-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Current User Section */}
          <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'border-surface-700 bg-surface-800' : 'border-surface-200 bg-surface-50'}`}>
            <div className="flex items-center gap-3 mb-3">
              <Lock className="w-5 h-5 text-primary-500" />
              <h3 className={`font-semibold ${textClass}`}>Current Session</h3>
            </div>
            <div className="space-y-2">
              <p className={`text-sm ${labelClass}`}>
                Logged in as: <span className="font-semibold text-primary-500">{userName}</span>
              </p>
              <p className={`text-sm ${labelClass}`}>
                Session: <span className="font-semibold">Active</span>
              </p>
            </div>
          </div>

          {/* Security Features */}
          <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'border-surface-700 bg-surface-800' : 'border-surface-200 bg-surface-50'}`}>
            <div className="flex items-center gap-3 mb-3">
              <Shield className="w-5 h-5 text-green-500" />
              <h3 className={`font-semibold ${textClass}`}>Security Features</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <p className={`text-sm ${labelClass}`}>JWT Token-based Authentication</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <p className={`text-sm ${labelClass}`}>HttpOnly Cookies (secure storage)</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <p className={`text-sm ${labelClass}`}>Role-Based Access Control (RBAC)</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <p className={`text-sm ${labelClass}`}>CORS Protection</p>
              </div>
            </div>
          </div>

          {/* Info Notice */}
          <div className={`p-4 rounded-lg border border-blue-200 ${theme === 'dark' ? 'bg-blue-900' : 'bg-blue-50'}`}>
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className={`font-semibold ${textClass} mb-1`}>Session Management</h4>
                <p className={`text-sm ${labelClass}`}>
                  Your session is stored securely in HttpOnly cookies. For additional security, logout from untrusted devices and keep your password private.
                </p>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <div className="flex justify-end gap-2 pt-4 border-t border-surface-200 dark:border-surface-700">
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
