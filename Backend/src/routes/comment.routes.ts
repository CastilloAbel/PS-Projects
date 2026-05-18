import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import logger from '../logger';
import { canCommentCard, canDeleteComment, logAudit } from '../authorization';

const router = Router();

// POST /comments - Crear comentario en una tarjeta
router.post('/', async (req: Request, res: Response) => {
  try {
    const { content, cardId } = req.body;
    const userId = (req as any).userId;

    if (!content || !cardId) {
      return res.status(400).json({ error: 'content y cardId son requeridos' });
    }

    if (content.trim().length === 0) {
      return res.status(400).json({ error: 'El comentario no puede estar vacío' });
    }

    // Verificar que puede comentar
    const canComment = await canCommentCard(userId, cardId);
    if (!canComment) {
      logger.warn(`User ${userId} tried to comment on card ${cardId} without permission`);
      return res.status(403).json({ error: 'No tienes permisos para comentar en esta tarjeta' });
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

    await logAudit('CREATE', 'COMMENT', comment.id, userId, { cardId, content: content.substring(0, 100) });
    logger.info(`User ${userId} created comment ${comment.id} on card ${cardId}`);

    res.status(201).json(comment);
  } catch (error) {
    logger.error('Error in POST /comments:', error);
    res.status(500).json({ error: 'Error al crear comentario' });
  }
});

// GET /comments - Obtener comentarios de una tarjeta
router.get('/', async (req: Request, res: Response) => {
  try {
    const cardId = req.query.cardId as string;
    const userId = (req as any).userId;

    if (!cardId) {
      return res.status(400).json({ error: 'cardId es requerido' });
    }

    // Verificar que puede ver la tarjeta
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
      return res.status(404).json({ error: 'Tarjeta no encontrada' });
    }

    // Verificar acceso al board
    const board = card.list.board;
    const hasAccess = board.ownerId === userId || 
      await prisma.boardMember.findUnique({
        where: { userId_boardId: { userId, boardId: board.id } }
      });

    if (!hasAccess) {
      logger.warn(`User ${userId} tried to get comments for card ${cardId} without access`);
      return res.status(403).json({ error: 'No tienes acceso a esta tarjeta' });
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

    logger.info(`User ${userId} retrieved ${comments.length} comments for card ${cardId}`);
    res.json(comments);
  } catch (error) {
    logger.error('Error in GET /comments:', error);
    res.status(500).json({ error: 'Error al obtener comentarios' });
  }
});

// PATCH /comments/:id - Editar comentario (solo propietario)
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const commentId = req.params.id as string;
    const { content } = req.body;
    const userId = (req as any).userId;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'El comentario no puede estar vacío' });
    }

    const comment = await prisma.comment.findUnique({ 
      where: { id: commentId }
    });

    if (!comment) {
      return res.status(404).json({ error: 'Comentario no encontrado' });
    }

    // Solo el propietario puede editar su comentario
    if (comment.userId !== userId) {
      logger.warn(`User ${userId} tried to edit comment ${commentId} by another user`);
      return res.status(403).json({ error: 'Solo puedes editar tus propios comentarios' });
    }

    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
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
    await prisma.activity.create({
      data: {
        action: 'commented_edited',
        description: `Editó comentario: "${content.substring(0, 50)}..."`,
        cardId: comment.cardId,
        userId
      }
    });

    await logAudit('UPDATE', 'COMMENT', commentId, userId, { content: content.substring(0, 100) });
    logger.info(`User ${userId} updated comment ${commentId}`);

    res.json(updatedComment);
  } catch (error) {
    logger.error('Error in PATCH /comments/:id:', error);
    res.status(500).json({ error: 'Error al actualizar comentario' });
  }
});

// DELETE /comments/:id - Eliminar comentario (propietario o admin/owner del board)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const commentId = req.params.id as string;
    const userId = (req as any).userId;

    const canDelete = await canDeleteComment(userId, commentId);
    if (!canDelete) {
      logger.warn(`User ${userId} tried to delete comment ${commentId} without permission`);
      return res.status(403).json({ error: 'No tienes permisos para eliminar este comentario' });
    }

    const comment = await prisma.comment.findUnique({ where: { id: commentId } });

    if (!comment) {
      return res.status(404).json({ error: 'Comentario no encontrado' });
    }

    await prisma.comment.delete({ where: { id: commentId } });

    // Registrar actividad
    await prisma.activity.create({
      data: {
        action: 'commented_deleted',
        description: 'Eliminó un comentario',
        cardId: comment.cardId,
        userId
      }
    });

    await logAudit('DELETE', 'COMMENT', commentId, userId, {});
    logger.info(`User ${userId} deleted comment ${commentId}`);

    res.json({ success: true, message: 'Comentario eliminado' });
  } catch (error) {
    logger.error('Error in DELETE /comments/:id:', error);
    res.status(500).json({ error: 'Error al eliminar comentario' });
  }
});

export default router;
