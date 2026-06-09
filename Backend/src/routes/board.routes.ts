import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import logger from '../logger';
import { canUserDoInBoard, logAudit } from '../authorization';
import { BoardRole } from '@prisma/client';

const router = Router();

// GET /boards - Obtener todos los tableros accesibles del usuario
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    // Obtener todos los boards donde el usuario es miembro o propietario
    const boards = await prisma.board.findMany({
      where: {
        OR: [
          { ownerId: userId },
          {
            members: {
              some: { userId }
            }
          },
          {
            workspace: {
              members: {
                some: { userId }
              }
            }
          }
        ]
      },
      include: {
        lists: {
          include: {
            cards: {
              include: {
                assignee: {
                  select: {
                    id: true,
                    name: true,
                    avatarUrl: true,
                    email: true
                  }
                },
                tags: {
                  include: {
                    tag: true
                  }
                }
              }
            }
          },
          orderBy: { order: 'asc' }
        }
      }
    });

    logger.info(`User ${userId} retrieved ${boards.length} boards`);
    res.json(boards);
  } catch (error) {
    logger.error('Error in GET /boards:', error);
    res.status(500).json({ error: 'Error al obtener los tableros' });
  }
});

// GET /boards/:id - Obtener un tablero específico
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const boardId = req.params.id as string;
    const userId = (req as any).userId;

    // Verificar acceso al board
    const hasAccess = await canUserDoInBoard(userId, boardId, 'VIEW');
    if (!hasAccess) {
      logger.warn(`User ${userId} tried to view board ${boardId} without permission`);
      res.status(403).json({ error: 'No tienes acceso a este tablero' });
      return;
    }

    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: {
        workspace: {
          include: {
            tags: true
          }
        },
        lists: {
          include: {
            cards: {
              include: {
                assignee: {
                  select: {
                    id: true,
                    name: true,
                    avatarUrl: true,
                    email: true
                  }
                },
                tags: {
                  include: {
                    tag: true
                  }
                }
              }
            }
          },
          orderBy: { order: 'asc' }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true
              }
            }
          }
        }
      }
    });

    if (!board) {
      res.status(404).json({ error: 'Tablero no encontrado' });
      return;
    }

    logger.info(`User ${userId} retrieved board ${boardId}`);
    res.json(board);
  } catch (error) {
    logger.error('Error in GET /boards/:id:', error);
    res.status(500).json({ error: 'Error al obtener el tablero' });
  }
});

// POST /boards - Crear un nuevo tablero
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, background, workspaceId, type = 'KANBAN', status = 'CREADO', startDate, members } = req.body;
    const userId = (req as any).userId;

    if (!name || !workspaceId) {
      res.status(400).json({ error: 'El nombre y workspaceId son requeridos' });
      return;
    }

    // Verificar acceso al workspace
    const workspaceMember = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: { userId, workspaceId }
      }
    });

    if (!workspaceMember) {
      logger.warn(`User ${userId} tried to create board in workspace ${workspaceId} without access`);
      res.status(403).json({ error: 'No tienes acceso a este workspace' });
      return;
    }

    const otherMembers = Array.isArray(members) ? members.filter((mId: string) => mId !== userId) : [];

    const board = await prisma.board.create({
      data: {
        name,
        background,
        workspaceId,
        ownerId: userId,
        type,
        status,
        startDate: startDate ? new Date(startDate) : null,
        members: {
          create: [
            { userId, role: BoardRole.OWNER },
            ...otherMembers.map((mId: string) => ({ userId: mId, role: BoardRole.VIEWER }))
          ]
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true
              }
            }
          }
        }
      }
    });

    await logAudit('CREATE', 'BOARD', board.id, userId, { name, workspaceId, type, status, startDate });
    logger.info(`User ${userId} created board ${board.id}`);

    res.status(201).json(board);
  } catch (error) {
    logger.error('Error in POST /boards:', error);
    res.status(500).json({ error: 'Error al crear el tablero' });
  }
});

// PATCH /boards/:id - Actualizar tablero (solo owner/admin)
router.patch('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const boardId = req.params.id as string;
    const userId = (req as any).userId;
    const { name, background, type, status, startDate } = req.body;

    // Verificar que es owner o admin
    const board = await prisma.board.findUnique({
      where: { id: boardId }
    });

    if (!board) {
      res.status(404).json({ error: 'Tablero no encontrado' });
      return;
    }

    const canEdit = await canUserDoInBoard(userId, boardId, 'EDIT');
    if (!canEdit || (board.ownerId !== userId && !(await canUserDoInBoard(userId, boardId, 'MANAGE_MEMBERS')))) {
      logger.warn(`User ${userId} tried to update board ${boardId} without permission`);
      res.status(403).json({ error: 'Solo owner/admin pueden actualizar el tablero' });
      return;
    }

    const updatedBoard = await prisma.board.update({
      where: { id: boardId },
      data: {
        ...(name && { name }),
        ...(background !== undefined && { background }),
        ...(type && { type }),
        ...(status && { status }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null })
      }
    });

    await logAudit('UPDATE', 'BOARD', boardId, userId, { name, background, type, status, startDate });
    logger.info(`User ${userId} updated board ${boardId}`);

    res.json(updatedBoard);
  } catch (error) {
    logger.error('Error in PATCH /boards/:id:', error);
    res.status(500).json({ error: 'Error al actualizar el tablero' });
  }
});

// DELETE /boards/:id - Eliminar tablero (solo owner)
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const boardId = req.params.id as string;
    const userId = (req as any).userId;

    const board = await prisma.board.findUnique({
      where: { id: boardId }
    });

    if (!board || board.ownerId !== userId) {
      logger.warn(`User ${userId} tried to delete board ${boardId} without permission`);
      res.status(403).json({ error: 'Solo el propietario puede eliminar el tablero' });
      return;
    }

    await prisma.board.delete({
      where: { id: boardId }
    });

    await logAudit('DELETE', 'BOARD', boardId, userId, {});
    logger.info(`User ${userId} deleted board ${boardId}`);

    res.status(204).send();
  } catch (error) {
    logger.error('Error in DELETE /boards/:id:', error);
    res.status(500).json({ error: 'Error al eliminar el tablero' });
  }
});

export default router;
