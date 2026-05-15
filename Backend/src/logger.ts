import winston from 'winston';
import path from 'path';

/**
 * Configuración de Winston Logger
 * Maneja logs en consola y archivos con diferentes niveles de severidad
 */

const isDevelopment = process.env.NODE_ENV !== 'production';

// Definir formato personalizado
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack }) => {
    if (stack) {
      return `${timestamp} [${level.toUpperCase()}]: ${message}\n${stack}`;
    }
    return `${timestamp} [${level.toUpperCase()}]: ${message}`;
  })
);

// Transports
const transports: winston.transport[] = [
  // Console transport
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.printf(({ level, message, timestamp }) => {
        return `${timestamp} ${level}: ${message}`;
      })
    )
  })
];

// En producción, guardar logs en archivos
if (!isDevelopment) {
  const logsDir = path.join(process.cwd(), 'logs');

  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: customFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      format: customFormat,
      maxsize: 5242880,
      maxFiles: 10
    })
  );
}

/**
 * Logger singleton
 * Uso: logger.info('Mensaje'), logger.error('Error'), etc.
 */
const logger = winston.createLogger({
  level: isDevelopment ? 'debug' : 'info',
  format: customFormat,
  transports,
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'exceptions.log')
    })
  ]
});

export default logger;
