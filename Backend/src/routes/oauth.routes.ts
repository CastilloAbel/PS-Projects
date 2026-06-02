import { Router, Request, Response } from 'express';
import passport from 'passport';

const router = Router();

/**
 * GET /auth/google
 * Inicia el flujo de autenticación con Google
 * Redirige al usuario a Google para que inicie sesión
 */
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })
);

/**
 * GET /auth/google/callback
 * Callback después de que el usuario se autentica con Google
 * Recibe el código de autorización y lo intercambia por un token
 */
router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/login?error=google_auth_failed',
    session: false
  }),
  (req: Request, res: Response) => {
    try {
      // Después de autenticación exitosa con Google
      const profile = (req as any).user;

      if (!profile || !profile.token) {
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=auth_failed`);
        return;
      }

      // Obtener datos del usuario
      const { user, token } = profile;

      // Configurar cookie httpOnly con el token JWT
      res.cookie('authToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
      });

      // Redirigir al frontend - el token está en la cookie, no en el URL
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/auth/callback?userId=${user.id}&email=${encodeURIComponent(user.email)}&name=${encodeURIComponent(user.name || '')}`);
    } catch (error) {
      console.error('Error in Google callback:', error);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=callback_error`);
    }
  }
);

/**
 * GET /auth/google/success
 * Endpoint para verificar si el usuario está autenticado
 * Retorna datos del usuario si tiene un token válido
 */
router.get('/google/success', (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      res.status(401).json({ error: 'No autorizado' });
      return;
    }

    res.json({
      message: 'Autenticado con Google',
      userId
    });
  } catch (error) {
    res.status(500).json({ error: 'Error verificando autenticación' });
  }
});

export default router;
