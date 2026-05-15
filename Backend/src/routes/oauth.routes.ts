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
        res.redirect('/login?error=auth_failed');
        return;
      }

      // Redirigir al frontend con el token en el query string
      // El frontend lo extraerá y lo guardará en la cookie
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/auth/callback?token=${profile.token}&userId=${profile.user.id}`);
    } catch (error) {
      console.error('Error in Google callback:', error);
      res.redirect('/login?error=callback_error');
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
