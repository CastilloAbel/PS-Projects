import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import logger from './logger';

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
      logger.warn(`Unauthorized access attempt to ${req.method} ${req.path} from ${req.ip}`);
      res.status(401).json({ error: 'No autorizado. Token no encontrado.' });
      return;
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
      req.userId = decoded.userId;
      logger.debug(`JWT verified for user ${decoded.userId}`);
      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        logger.warn(`Token expired for request to ${req.method} ${req.path}`);
        res.status(401).json({ error: 'Token expirado' });
      } else if (error instanceof jwt.JsonWebTokenError) {
        logger.warn(`Invalid token for request to ${req.method} ${req.path}`);
        res.status(401).json({ error: 'Token inválido' });
      } else {
        res.status(401).json({ error: 'Token inválido o expirado' });
      }
    }
  } catch (error) {
    logger.error('Error en verifyJWT middleware:', error);
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
  logger.error('Unhandled error:', err);

  // Errores de validación
  if (err.name === 'ValidationError') {
    logger.warn(`Validation error on ${req.method} ${req.path}`);
    res.status(400).json({ error: 'Datos inválidos', details: err.message });
    return;
  }

  // Errores de base de datos
  if (err.code && err.code.startsWith('P')) {
    // Prisma error
    logger.error(`Prisma error ${err.code} on ${req.method} ${req.path}`);
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

    const logMessage = `${req.method} ${req.path} ${statusCode} ${duration}ms${userId}`;

    if (statusCode >= 500) {
      logger.error(logMessage);
    } else if (statusCode >= 400) {
      logger.warn(logMessage);
    } else {
      logger.info(logMessage);
    }
  });

  next();
};
