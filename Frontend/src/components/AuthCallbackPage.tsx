import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useError } from '../context/ErrorContext';
import { Loader2 } from 'lucide-react';

/**
 * Página de callback para OAuth de Google
 * Intercambia el token recibido desde el backend y configura la sesión
 */
export const AuthCallbackPage: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const { login } = useAuth();
  const { showError } = useError();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const userId = params.get('userId');
        const email = params.get('email');
        const name = params.get('name');
        const error = params.get('error');

        if (error) {
          showError(`Error de autenticación: ${error}`);
          window.location.href = '/login';
          return;
        }

        if (!userId || !email) {
          showError('Datos de autenticación incompletos');
          window.location.href = '/login';
          return;
        }

        // El token ya está en la cookie httpOnly (configurado por el backend)
        // No necesitamos manejarlo manualmente

        // Configurar el contexto de autenticación con los datos reales del usuario
        const userData = {
          id: userId,
          email: email,
          name: name || 'User',
          avatarUrl: undefined
        };

        // Configurar el contexto de autenticación
        login(userData);

        // Redirigir al dashboard
        onSuccess();
      } catch (error: any) {
        console.error('Error en callback:', error);
        showError('Error procesando autenticación');
        window.location.href = '/login';
      }
    };

    handleCallback();
  }, [login, showError, onSuccess]);

  return (
    <div className="h-screen w-full flex items-center justify-center bg-surface-50 dark:bg-surface-950">
      <div className="text-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary-500 mx-auto mb-4" />
        <p className="text-surface-600 dark:text-surface-400">Procesando autenticación...</p>
      </div>
    </div>
  );
};
