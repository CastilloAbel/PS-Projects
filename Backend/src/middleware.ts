import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend Express Request interface to include userId
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

interface JwtPayload {
  userId: string;
  email: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'ps-project-secret-key-change-in-production';

/**
 * Middleware para verificar JWT en todas las rutas protegidas
 * Lee el token desde cookies (httpOnly) o Authorization header como fallback
 * Extrae el userId del token y lo añade a req.userId
 */
export const verifyJWT = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Try to get token from httpOnly cookie first, then from Authorization header
    let token = req.cookies?.authToken;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      res.status(401).json({ error: 'No autorizado. Token no encontrado.' });
      return;
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
      req.userId = decoded.userId;
      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        res.status(401).json({ error: 'Token expirado' });
      } else if (error instanceof jwt.JsonWebTokenError) {
        res.status(401).json({ error: 'Token inválido' });
      } else {
        res.status(401).json({ error: 'Token inválido o expirado' });
      }
    }
  } catch (error) {
    console.error('Error en verifyJWT middleware:', error);
    res.status(500).json({ error: 'Error al verificar autenticación' });
  }
};

/**
 * Middleware para manejo de errores global
 * Captura y formatea errores no manejados
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error no manejado:', err);

  // Errores de validación
  if (err.name === 'ValidationError') {
    res.status(400).json({ error: 'Datos inválidos', details: err.message });
    return;
  }

  // Errores de base de datos
  if (err.code && err.code.startsWith('P')) {
    // Prisma error
    if (err.code === 'P2002') {
      res.status(409).json({ error: 'Registro duplicado' });
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json({ error: 'Registro no encontrado' });
      return;
    }
  }

  // Error por defecto
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * Middleware para logging de peticiones
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    const userId = req.userId ? ` [User: ${req.userId}]` : '';

    console.log(
      `${req.method} ${req.path} ${statusCode} ${duration}ms${userId}`
    );
  });

  next();
};
