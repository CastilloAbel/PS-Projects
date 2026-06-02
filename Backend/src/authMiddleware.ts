import { Request, Response, NextFunction } from 'express';

// Stub middlewares - mantener para compatibilidad, pero no hacen nada
export const requireWorkspaceAdmin = (req: Request, res: Response, next: NextFunction) => {
  next();
};

export const requireBoardOwner = async (req: Request, res: Response, next: NextFunction) => {
  next();
};

export const requireBoardPermission = (action: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    next();
  };
};
