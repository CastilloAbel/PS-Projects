import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import logger from '../logger';
import { canEditCard, canViewCard, canCommentCard, canCreateCard, logAudit } from '../authorization';

const router = Router();

// POST /cards - Crear una nueva tarjeta en una lista
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, listId, order, assigneeId, priority, startDate, dueDate } = req.body;
    const userId = (req as any).userId;

    if (!title || !listId || order === undefined) {
      res.status(400).json({ error: 'Título, listId y order son requeridos' });
      return;
    }

    // Verificar que puede crear tarjeta en este board
    const list = await prisma.list.findUnique({
      where: { id: listId },
      include: { board: true }
    });

    if (!list) {
      res.status(404).json({ error: 'La lista proporcionada no existe' });
      return;
    }

    const canCreate = await canCreateCard(userId, list.board.id);
    if (!canCreate) {
      logger.warn(`User ${userId} tried to create card in board ${list.board.id} without permission`);
      res.status(403).json({ error: 'No tienes permisos para crear tarjetas en este tablero' });
      return;
    }

    const card = await prisma.card.create({
      data: {
        title,
        description,
        order,
        listId,
        assigneeId,
        priority: priority || 'MEDIUM',
        startDate: startDate ? new Date(startDate) : null,
        dueDate: dueDate ? new Date(dueDate) : null
      },
      include: {
        assignee: {
          select: { id: true, name: true, avatarUrl: true }
        },
        tags: {
          include: { tag: true }
        }
      }
    });

    // Registrar actividad
    await prisma.activity.create({
      data: {
        action: 'created',
        description: `Creó la tarjeta "${title}"`,
        cardId: card.id,
        userId
      }
    });

    await logAudit('CREATE', 'CARD', card.id, userId, { title, listId });
    logger.info(`User ${userId} created card ${card.id}`);

    res.status(201).json(card);
  } catch (error) {
    logger.error('Error in POST /cards:', error);
    res.status(500).json({ error: 'Error al crear la tarjeta' });
  }
});

// GET /cards/:id - Obtener tarjeta completa
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const cardId = req.params.id as string;
    const userId = (req as any).userId;

    // Verificar acceso
    const canView = await canViewCard(userId, cardId);
    if (!canView) {
      logger.warn(`User ${userId} tried to view card ${cardId} without permission`);
      res.status(403).json({ error: 'No tienes acceso a esta tarjeta' });
      return;
    }

    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: {
        assignee: {
          select: { id: true, name: true, avatarUrl: true, email: true }
        },
        tags: {
          include: { tag: true }
        },
        comments: {
          include: {
            user: {
              select: { id: true, name: true, avatarUrl: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        activities: {
          include: {
            user: {
              select: { id: true, name: true, avatarUrl: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!card) {
      res.status(404).json({ error: 'Tarjeta no encontrada' });
      return;
    }

    logger.info(`User ${userId} retrieved card ${cardId}`);
    res.json(card);
  } catch (error) {
    logger.error('Error in GET /cards/:id:', error);
    res.status(500).json({ error: 'Error al obtener la tarjeta' });
  }
});

// PATCH /cards/:id/move - Mover una tarjeta de lista o reordenar
router.patch('/:id/move', async (req: Request, res: Response): Promise<void> => {
  try {
    const cardId = req.params.id as string;
    const { listId, order } = req.body;
    const userId = (req as any).userId;

    if (!listId || order === undefined) {
      res.status(400).json({ error: 'listId y order son requeridos para mover' });
      return;
    }

    // Verificar que puede editar la tarjeta
    const canEdit = await canEditCard(userId, cardId);
    if (!canEdit) {
      logger.warn(`User ${userId} tried to move card ${cardId} without permission`);
      res.status(403).json({ error: 'No tienes permisos para mover esta tarjeta' });
      return;
    }

    const card = await prisma.card.update({
      where: { id: cardId },
      data: {
        listId,
        order
      },
      include: {
        assignee: { select: { id: true, name: true, avatarUrl: true } },
        tags: { include: { tag: true } }
      }
    });

    // Registrar actividad
    await prisma.activity.create({
      data: {
        action: 'moved',
        description: `Movió la tarjeta`,
        cardId: card.id,
        userId
      }
    });

    await logAudit('UPDATE', 'CARD', cardId, userId, { listId, order });
    logger.info(`User ${userId} moved card ${cardId}`);

    res.json(card);
  } catch (error) {
    logger.error('Error in PATCH /cards/:id/move:', error);
    res.status(500).json({ error: 'Error al mover la tarjeta' });
  }
});

// PATCH /cards/:id - Actualizar datos de una tarjeta
router.patch('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const cardId = req.params.id as string;
    const { title, description, assigneeId, priority, startDate, dueDate, isCompleted } = req.body;
    const userId = (req as any).userId;

    // Verificar que puede editar la tarjeta
    const canEdit = await canEditCard(userId, cardId);
    if (!canEdit) {
      logger.warn(`User ${userId} tried to edit card ${cardId} without permission`);
      res.status(403).json({ error: 'No tienes permisos para editar esta tarjeta' });
      return;
    }

    // Build update data object
    const updateData: any = {};
    
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (priority !== undefined) updateData.priority = priority;
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (isCompleted !== undefined) updateData.isCompleted = isCompleted;
    
    if (assigneeId !== undefined) {
      updateData.assigneeId = assigneeId === '' ? null : assigneeId;
    }

    const card = await prisma.card.update({
      where: { id: cardId },
      data: updateData,
      include: {
        assignee: { select: { id: true, name: true, avatarUrl: true, email: true } },
        tags: { include: { tag: true } },
        comments: {
          include: {
            user: {
              select: { id: true, name: true, avatarUrl: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        activities: {
          include: {
            user: {
              select: { id: true, name: true, avatarUrl: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    // Registrar actividad
    await prisma.activity.create({
      data: {
        action: 'updated',
        description: `Actualizó la tarjeta`,
        cardId: card.id,
        userId
      }
    });

    await logAudit('UPDATE', 'CARD', cardId, userId, updateData);
    logger.info(`User ${userId} updated card ${cardId}`);

    res.json(card);
  } catch (error) {
    logger.error('Error in PATCH /cards/:id:', error);
    res.status(500).json({ error: 'Error al actualizar la tarjeta' });
  }
});

// DELETE /cards/:id - Eliminar tarjeta (solo owner/admin del board)
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const cardId = req.params.id as string;
    const userId = (req as any).userId;

    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: {
        list: {
          include: {
            board: true
          }
        }
      }
    });

    if (!card) {
      res.status(404).json({ error: 'Tarjeta no encontrada' });
      return;
    }

    // Solo owner/admin del board pueden eliminar tarjetas
    const board = card.list.board;
    if (board.ownerId !== userId) {
      const boardMember = await prisma.boardMember.findUnique({
        where: {
          userId_boardId: { userId, boardId: board.id }
        }
      });

      if (!boardMember || boardMember.role !== 'ADMIN') {
        logger.warn(`User ${userId} tried to delete card ${cardId} without permission`);
        res.status(403).json({ error: 'No tienes permisos para eliminar tarjetas' });
        return;
      }
    }

    await prisma.card.delete({
      where: { id: cardId }
    });

    await logAudit('DELETE', 'CARD', cardId, userId, {});
    logger.info(`User ${userId} deleted card ${cardId}`);

    res.status(204).send();
  } catch (error) {
    logger.error('Error in DELETE /cards/:id:', error);
    res.status(500).json({ error: 'Error al eliminar la tarjeta' });
  }
});

// POST /cards/:id/tags - Asignar etiqueta a tarjeta
router.post('/:id/tags', async (req: Request, res: Response): Promise<void> => {
  try {
    const cardId = req.params.id as string;
    const { tagId } = req.body;
    const userId = (req as any).userId;

    if (!tagId) {
      res.status(400).json({ error: 'tagId es requerido' });
      return;
    }

    // Verificar que puede editar la tarjeta
    const canEdit = await canEditCard(userId, cardId);
    if (!canEdit) {
      logger.warn(`User ${userId} tried to add tag to card ${cardId} without permission`);
      res.status(403).json({ error: 'No tienes permisos para añadir etiquetas a esta tarjeta' });
      return;
    }

    const tag = await prisma.tag.findUnique({ where: { id: tagId } });
    
    const cardTag = await prisma.cardTag.create({
      data: {
        cardId,
        tagId
      }
    });

    // Registrar actividad
    if (tag) {
      await prisma.activity.create({
        data: {
          action: 'tag_added',
          description: `Agregó la etiqueta "${tag.name}"`,
          cardId,
          userId
        }
      });
    }

    await logAudit('UPDATE', 'CARD', cardId, userId, { action: 'tag_added', tagId });
    logger.info(`User ${userId} added tag ${tagId} to card ${cardId}`);

    res.status(201).json({ ...cardTag, tag });
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'Esta etiqueta ya está asignada a la tarjeta' });
      return;
    }
    logger.error('Error in POST /cards/:id/tags:', error);
    res.status(500).json({ error: 'Error al asignar etiqueta' });
  }
});

// DELETE /cards/:id/tags/:tagId - Remover etiqueta de tarjeta
router.delete('/:id/tags/:tagId', async (req: Request, res: Response): Promise<void> => {
  try {
    const cardId = req.params.id as string;
    const tagId = req.params.tagId as string;
    const userId = (req as any).userId;

    // Verificar que puede editar la tarjeta
    const canEdit = await canEditCard(userId, cardId);
    if (!canEdit) {
      logger.warn(`User ${userId} tried to remove tag from card ${cardId} without permission`);
      res.status(403).json({ error: 'No tienes permisos para remover etiquetas de esta tarjeta' });
      return;
    }

    const tag = await prisma.tag.findUnique({ where: { id: tagId } });

    await prisma.cardTag.deleteMany({
      where: {
        cardId,
        tagId
      }
    });

    // Registrar actividad
    if (tag) {
      await prisma.activity.create({
        data: {
          action: 'tag_removed',
          description: `Removió la etiqueta "${tag.name}"`,
          cardId,
          userId
        }
      });
    }

    await logAudit('UPDATE', 'CARD', cardId, userId, { action: 'tag_removed', tagId });
    logger.info(`User ${userId} removed tag ${tagId} from card ${cardId}`);

    res.json({ success: true, message: 'Etiqueta removida' });
  } catch (error) {
    logger.error('Error in DELETE /cards/:id/tags/:tagId:', error);
    res.status(500).json({ error: 'Error al remover etiqueta' });
  }
});

export default router;
