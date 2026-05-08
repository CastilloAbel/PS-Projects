import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';

const router = Router();

// POST /cards - Crear una nueva tarjeta en una lista
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, listId, order, assigneeId, priority, startDate, dueDate } = req.body;

    if (!title || !listId || order === undefined) {
      res.status(400).json({ error: 'Título, listId y order son requeridos' });
      return;
    }

    const listExists = await prisma.list.findUnique({
      where: { id: listId }
    });

    if (!listExists) {
      res.status(404).json({ error: 'La lista proporcionada no existe' });
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
        userId: assigneeId || 'system' // Aquí sería mejor pasar userId desde frontend
      }
    });

    res.status(201).json(card);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear la tarjeta' });
  }
});

// GET /cards/:id - Obtener tarjeta completa con todos sus datos
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const card = await prisma.card.findUnique({
      where: { id },
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

    res.json(card);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener la tarjeta' });
  }
});

// PATCH /cards/:id/move - Mover una tarjeta de lista o reordenar
router.patch('/:id/move', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { listId, order, userId } = req.body;

    if (!listId || order === undefined) {
      res.status(400).json({ error: 'listId y order son requeridos para mover' });
      return;
    }

    const card = await prisma.card.update({
      where: { id },
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
    if (userId) {
      await prisma.activity.create({
        data: {
          action: 'moved',
          description: `Movió la tarjeta`,
          cardId: card.id,
          userId
        }
      });
    }

    res.json(card);
  } catch (error) {
    res.status(500).json({ error: 'Error al mover la tarjeta' });
  }
});

// PATCH /cards/:id - Actualizar datos de una tarjeta
router.patch('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { title, description, assigneeId, priority, startDate, dueDate, isCompleted, userId } = req.body;

    const card = await prisma.card.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(priority !== undefined && { priority }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(isCompleted !== undefined && { isCompleted }),
        assigneeId: assigneeId === null ? null : assigneeId || undefined,
      },
      include: {
        assignee: { select: { id: true, name: true, avatarUrl: true } },
        tags: { include: { tag: true } }
      }
    });

    // Registrar actividad
    if (userId) {
      await prisma.activity.create({
        data: {
          action: 'updated',
          description: `Actualizó la tarjeta`,
          cardId: card.id,
          userId
        }
      });
    }

    res.json(card);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar la tarjeta' });
  }
});

// POST /cards/:id/tags - Asignar etiqueta a tarjeta
router.post('/:id/tags', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { tagId, userId } = req.body;

    if (!tagId) {
      res.status(400).json({ error: 'tagId es requerido' });
      return;
    }

    const tag = await prisma.tag.findUnique({ where: { id: tagId } });
    
    const cardTag = await prisma.cardTag.create({
      data: {
        cardId: id,
        tagId
      }
    });

    // Registrar actividad
    if (userId && tag) {
      await prisma.activity.create({
        data: {
          action: 'tag_added',
          description: `Agregó la etiqueta "${tag.name}"`,
          cardId: id,
          userId
        }
      });
    }

    res.status(201).json({ ...cardTag, tag });
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'Esta etiqueta ya está asignada a la tarjeta' });
      return;
    }
    res.status(500).json({ error: 'Error al asignar etiqueta' });
  }
});

// DELETE /cards/:id/tags/:tagId - Remover etiqueta de tarjeta
router.delete('/:id/tags/:tagId', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const tagId = req.params.tagId as string;
    const userId = req.body.userId as string | undefined;

    const tag = await prisma.tag.findUnique({ where: { id: tagId } });

    await prisma.cardTag.deleteMany({
      where: {
        cardId: id,
        tagId
      }
    });

    // Registrar actividad
    if (userId && tag) {
      await prisma.activity.create({
        data: {
          action: 'tag_removed',
          description: `Removió la etiqueta "${tag.name}"`,
          cardId: id,
          userId
        }
      });
    }

    res.json({ success: true, message: 'Etiqueta removida' });
  } catch (error) {
    res.status(500).json({ error: 'Error al remover etiqueta' });
  }
});

export default router;
