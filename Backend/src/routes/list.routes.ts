import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import logger from '../logger';
import { canUserDoInBoard, logAudit } from '../authorization';

const router = Router();

// POST /lists - Crear una nueva columna en un tablero
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, boardId, order } = req.body;
    const userId = (req as any).userId;

    if (!name || !boardId || order === undefined) {
      res.status(400).json({ error: 'Nombre, boardId y order son requeridos' });
      return;
    }

    const board = await prisma.board.findUnique({
      where: { id: boardId }
    });

    if (!board) {
      res.status(404).json({ error: 'El Tablero proporcionado no existe' });
      return;
    }

    // Verificar permisos
    const canCreate = await canUserDoInBoard(userId, boardId, 'CREATE');
    if (!canCreate) {
      logger.warn(`User ${userId} tried to create list in board ${boardId} without permission`);
      res.status(403).json({ error: 'No tienes permisos para crear columnas en este tablero' });
      return;
    }

    const list = await prisma.list.create({
      data: {
        name,
        order,
        boardId
      }
    });

    await logAudit('CREATE', 'LIST', list.id, userId, { name, boardId });
    logger.info(`User ${userId} created list ${list.id} in board ${boardId}`);

    res.status(201).json(list);
  } catch (error) {
    logger.error('Error in POST /lists:', error);
    res.status(500).json({ error: 'Error al crear la columna (lista)' });
  }
});

// PATCH /lists/:id - Actualizar lista
router.patch('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const listId = req.params.id as string;
    const { name, order } = req.body;
    const userId = (req as any).userId;

    const list = await prisma.list.findUnique({
      where: { id: listId },
      include: { board: true }
    });

    if (!list) {
      res.status(404).json({ error: 'Lista no encontrada' });
      return;
    }

    // Verificar permisos
    const canEdit = await canUserDoInBoard(userId, list.board.id, 'EDIT');
    if (!canEdit) {
      logger.warn(`User ${userId} tried to update list ${listId} without permission`);
      res.status(403).json({ error: 'No tienes permisos para actualizar columnas' });
      return;
    }

    const updatedList = await prisma.list.update({
      where: { id: listId },
      data: {
        ...(name && { name }),
        ...(order !== undefined && { order })
      }
    });

    await logAudit('UPDATE', 'LIST', listId, userId, { name, order });
    logger.info(`User ${userId} updated list ${listId}`);

    res.json(updatedList);
  } catch (error) {
    logger.error('Error in PATCH /lists/:id:', error);
    res.status(500).json({ error: 'Error al actualizar la lista' });
  }
});

// DELETE /lists/:id - Eliminar lista
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const listId = req.params.id as string;
    const userId = (req as any).userId;

    const list = await prisma.list.findUnique({
      where: { id: listId },
      include: { board: true }
    });

    if (!list) {
      res.status(404).json({ error: 'Lista no encontrada' });
      return;
    }

    // Verificar permisos - solo owner/admin puede eliminar
    if (list.board.ownerId !== userId) {
      const member = await prisma.boardMember.findUnique({
        where: { userId_boardId: { userId, boardId: list.board.id } }
      });

      if (!member || member.role !== 'ADMIN') {
        logger.warn(`User ${userId} tried to delete list ${listId} without permission`);
        res.status(403).json({ error: 'No tienes permisos para eliminar columnas' });
        return;
      }
    }

    await prisma.list.delete({
      where: { id: listId }
    });

    await logAudit('DELETE', 'LIST', listId, userId, {});
    logger.info(`User ${userId} deleted list ${listId}`);

    res.status(204).send();
  } catch (error) {
    logger.error('Error in DELETE /lists/:id:', error);
    res.status(500).json({ error: 'Error al eliminar la lista' });
  }
});

export default router;
