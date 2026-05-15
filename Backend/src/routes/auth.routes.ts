import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { prisma } from '../prisma';
import { validateRequest } from '../validation';
import { loginSchema, changePasswordSchema } from '../schemas';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'ps-project-secret-key-change-in-production';

interface JwtPayload {
  userId: string;
  email: string;
}

// Rate limiter for login attempts
// Máximo 5 intentos cada 15 minutos por IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos
  message: 'Demasiados intentos de login. Intenta de nuevo en 15 minutos.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'development' // Skip en desarrollo
});

// POST /auth/login - Login with email and password
router.post('/login', loginLimiter, validateRequest(loginSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email y contraseña son requeridos' });
      return;
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      res.status(401).json({ error: 'Credenciales inválidas' });
      return;
    }

    // Compare passwords
    const passwordValid = await bcrypt.compare(password, user.password || '');

    if (!passwordValid) {
      res.status(401).json({ error: 'Credenciales inválidas' });
      return;
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email } as JwtPayload,
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set httpOnly cookie with token (secure in production)
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: isProduction, // Only send over HTTPS in production
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
    });

    // Return user info (without token in body for security)
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl
      }
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

// POST /auth/change-password - Change password (requires JWT)
router.post('/change-password', validateRequest(changePasswordSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    // JWT is verified by global middleware, userId is in req.userId
    const userId = (req as any).userId;

    if (!userId) {
      res.status(401).json({ error: 'No autorizado' });
      return;
    }

    const { currentPassword, newPassword } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    // Verify current password
    const passwordValid = await bcrypt.compare(currentPassword, user.password || '');

    if (!passwordValid) {
      res.status(401).json({ error: 'Contraseña actual incorrecta' });
      return;
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Error al cambiar la contraseña' });
  }
});

// POST /auth/logout - Clear auth cookie
router.post('/logout', (req: Request, res: Response): void => {
  res.clearCookie('authToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  res.json({ message: 'Logout exitoso' });
});

export default router;
