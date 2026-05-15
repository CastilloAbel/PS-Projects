import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

/**
 * Middleware para validar request body contra un schema de Zod
 * @param schema - Schema de Zod para validar
 * @returns Middleware Express
 */
export const validateRequest = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error: any) {
      res.status(400).json({
        error: 'Datos inválidos',
        details: error.errors?.map((e: any) => ({
          field: e.path.join('.'),
          message: e.message
        }))
      });
    }
  };
};
