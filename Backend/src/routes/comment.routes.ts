import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';

const router = Router();

// POST /comments - Crear comentario en una tarjeta
router.post('/', async (req: Request, res: Response) => {
  try {
    const { content, cardId, userId } = req.body;

    if (!content || !cardId || !userId) {
      return res.status(400).json({ error: 'content, cardId y userId son requeridos' });
    }

    if (content.trim().length === 0) {
      return res.status(400).json({ error: 'El comentario no puede estar vacío' });
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        cardId,
        userId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            email: true
          }
        }
      }
    });

    // Registrar actividad
    await prisma.activity.create({
      data: {
        action: 'commented',
        description: `Comentó: "${content.substring(0, 50)}..."`,
        cardId,
        userId
      }
    });

    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear comentario' });
  }
});

// GET /comments - Obtener comentarios de una tarjeta
router.get('/', async (req: Request, res: Response) => {
  try {
    const cardId = req.query.cardId as string;

    if (!cardId) {
      return res.status(400).json({ error: 'cardId es requerido' });
    }

    const comments = await prisma.comment.findMany({
      where: { cardId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener comentarios' });
  }
});

// PATCH /comments/:id - Editar comentario
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { content, userId } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'El comentario no puede estar vacío' });
    }

    const comment = await prisma.comment.update({
      where: { id },
      data: { content },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        }
      }
    });

    // Registrar actividad
    if (userId) {
      await prisma.activity.create({
        data: {
          action: 'commented_edited',
          description: `Editó comentario: "${content.substring(0, 50)}..."`,
          cardId: comment.cardId,
          userId
        }
      });
    }

    res.json(comment);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar comentario' });
  }
});

// DELETE /comments/:id - Eliminar comentario
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = req.body.userId as string | undefined;

    const comment = await prisma.comment.findUnique({ where: { id } });

    if (!comment) {
      return res.status(404).json({ error: 'Comentario no encontrado' });
    }

    await prisma.comment.delete({ where: { id } });

    // Registrar actividad
    if (userId) {
      await prisma.activity.create({
        data: {
          action: 'commented_deleted',
          description: 'Eliminó un comentario',
          cardId: comment.cardId,
          userId
        }
      });
    }

    res.json({ success: true, message: 'Comentario eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar comentario' });
  }
});

export default router;
