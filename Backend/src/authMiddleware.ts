import { Request, Response, NextFunction } from 'express';
import { prisma } from './prisma';
import logger from './logger';
import { WorkspaceRole, BoardRole } from '@prisma/client';

/**
 * Middleware que verifica que el usuario tiene acceso al workspace
 */
export async function requireWorkspaceAccess(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const workspaceId = req.params.workspaceId as string;
    const userId = (req as any).userId;

    if (!workspaceId) {
      res.status(400).json({ error: 'workspaceId es requerido' });
      return;
    }

    const member = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: { userId, workspaceId }
      }
    });

    if (!member) {
      logger.warn(`User ${userId} tried to access workspace ${workspaceId} without permission`);
      res.status(403).json({ error: 'No tienes acceso a este workspace' });
      return;
    }

    // Agregar info al request
    (req as any).workspaceRole = member.role as unknown as WorkspaceRole;
    next();
  } catch (error) {
    logger.error('Error in requireWorkspaceAccess middleware:', error);
    res.status(500).json({ error: 'Error de autorización' });
  }
}

/**
 * Middleware que verifica que el usuario tiene acceso al board
 */
export async function requireBoardAccess(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const boardId = req.params.boardId as string;
    const userId = (req as any).userId;

    if (!boardId) {
      res.status(400).json({ error: 'boardId es requerido' });
      return;
    }

    const board = await prisma.board.findUnique({
      where: { id: boardId }
    });

    if (!board) {
      res.status(404).json({ error: 'Board no encontrado' });
      return;
    }

    // Verificar acceso al workspace primero
    const workspaceMember = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: { userId, workspaceId: board.workspaceId }
      }
    });

    if (!workspaceMember) {
      logger.warn(`User ${userId} tried to access board ${boardId} without workspace access`);
      res.status(403).json({ error: 'No tienes acceso a este board' });
      return;
    }

    // Determinar rol en el board
    let boardRole: BoardRole;

    if (board.ownerId === userId) {
      boardRole = BoardRole.OWNER as unknown as BoardRole;
    } else {
      const boardMember = await prisma.boardMember.findUnique({
        where: {
          userId_boardId: { userId, boardId }
        }
      });

      if (!boardMember) {
        logger.warn(`User ${userId} tried to access board ${boardId} without permission`);
        res.status(403).json({ error: 'No tienes acceso a este board' });
        return;
      }

      boardRole = boardMember.role as unknown as BoardRole;
    }

    // Agregar info al request
    (req as any).boardRole = boardRole;
    (req as any).boardId = boardId;
    next();
  } catch (error) {
    logger.error('Error in requireBoardAccess middleware:', error);
    res.status(500).json({ error: 'Error de autorización' });
  }
}

/**
 * Middleware que verifica que el usuario tiene permisos específicos en un board
 */
export function requireBoardPermission(requiredAction: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const boardRole: BoardRole = (req as any).boardRole;

      if (!boardRole) {
        res.status(401).json({ error: 'No autenticado' });
        return;
      }

      const permissions: Record<BoardRole, string[]> = {
        [BoardRole.OWNER]: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'MANAGE_MEMBERS', 'COMMENT'],
        [BoardRole.ADMIN]: ['VIEW', 'CREATE', 'EDIT', 'MANAGE_MEMBERS', 'COMMENT'],
        [BoardRole.EDITOR]: ['VIEW', 'CREATE', 'EDIT', 'COMMENT'],
        [BoardRole.COMMENTER]: ['VIEW', 'COMMENT'],
        [BoardRole.VIEWER]: ['VIEW']
      };

      const userPermissions = permissions[boardRole] || [];

      if (!userPermissions.includes(requiredAction)) {
        logger.warn(
          `User with role ${boardRole} tried to perform ${requiredAction} without permission`
        );
        res.status(403).json({ error: 'No tienes permisos para esta acción' });
        return;
      }

      next();
    } catch (error) {
      logger.error('Error in requireBoardPermission middleware:', error);
      res.status(500).json({ error: 'Error de autorización' });
    }
  };
}

/**
 * Middleware que verifica que el usuario es owner del board
 */
export async function requireBoardOwner(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const boardId = req.params.boardId as string;
    const userId = (req as any).userId;

    const board = await prisma.board.findUnique({
      where: { id: boardId }
    });

    if (!board || board.ownerId !== userId) {
      logger.warn(`User ${userId} tried to perform owner action on board ${boardId}`);
      res.status(403).json({ error: 'Solo el propietario del board puede hacer esto' });
      return;
    }

    next();
  } catch (error) {
    logger.error('Error in requireBoardOwner middleware:', error);
    res.status(500).json({ error: 'Error de autorización' });
  }
}

/**
 * Middleware que verifica que el usuario es owner o admin del workspace
 */
export async function requireWorkspaceAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const workspaceId = req.params.workspaceId as string;
    const userId = (req as any).userId;

    const member = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: { userId, workspaceId }
      }
    });

    if (!member || (member.role !== WorkspaceRole.OWNER && member.role !== WorkspaceRole.ADMIN)) {
      logger.warn(`User ${userId} tried to perform admin action on workspace ${workspaceId}`);
      res.status(403).json({ error: 'Solo administradores pueden hacer esto' });
      return;
    }

    next();
  } catch (error) {
    logger.error('Error in requireWorkspaceAdmin middleware:', error);
    res.status(500).json({ error: 'Error de autorización' });
  }
}
