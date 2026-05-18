import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import logger from '../logger';
import { isWorkspaceMember, isWorkspaceAdmin, logAudit } from '../authorization';

const router = Router();

// POST /tags - Crear una nueva etiqueta (solo admins del workspace)
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, color, workspaceId } = req.body;
    const userId = (req as any).userId;

    if (!name || !color || !workspaceId) {
      return res.status(400).json({ error: 'name, color y workspaceId son requeridos' });
    }

    // Validar formato color HEX
    if (!/^#[0-9A-F]{6}$/i.test(color)) {
      return res.status(400).json({ error: 'El color debe ser un valor HEX válido (ej: #FF5733)' });
    }

    // Verificar acceso al workspace
    const isAdmin = await isWorkspaceAdmin(userId, workspaceId);
    if (!isAdmin) {
      logger.warn(`User ${userId} tried to create tag in workspace ${workspaceId} without permission`);
      return res.status(403).json({ error: 'Solo administradores pueden crear etiquetas' });
    }

    const tag = await prisma.tag.create({
      data: {
        name,
        color,
        workspaceId
      }
    });

    await logAudit('CREATE', 'TAG', tag.id, userId, { name, color });
    logger.info(`User ${userId} created tag ${tag.id}`);

    res.status(201).json(tag);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Ya existe una etiqueta con este nombre en el workspace' });
    }
    logger.error('Error in POST /tags:', error);
    res.status(500).json({ error: 'Error al crear etiqueta' });
  }
});

// GET /tags - Obtener todas las etiquetas de un workspace
router.get('/', async (req: Request, res: Response) => {
  try {
    const workspaceId = req.query.workspaceId as string;
    const userId = (req as any).userId;

    if (!workspaceId) {
      return res.status(400).json({ error: 'workspaceId es requerido' });
    }

    // Verificar acceso al workspace
    const isMember = await isWorkspaceMember(userId, workspaceId);
    if (!isMember) {
      logger.warn(`User ${userId} tried to get tags for workspace ${workspaceId} without access`);
      return res.status(403).json({ error: 'No tienes acceso a este workspace' });
    }

    const tags = await prisma.tag.findMany({
      where: { workspaceId },
      orderBy: { name: 'asc' }
    });

    logger.info(`User ${userId} retrieved ${tags.length} tags from workspace ${workspaceId}`);
    res.json(tags);
  } catch (error) {
    logger.error('Error in GET /tags:', error);
    res.status(500).json({ error: 'Error al obtener etiquetas' });
  }
});

// GET /tags/:id - Obtener etiqueta por ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const tagId = req.params.id as string;
    const userId = (req as any).userId;

    const tag = await prisma.tag.findUnique({
      where: { id: tagId },
      include: {
        cards: {
          include: {
            card: true
          }
        }
      }
    });

    if (!tag) {
      return res.status(404).json({ error: 'Etiqueta no encontrada' });
    }

    // Verificar acceso al workspace
    const isMember = await isWorkspaceMember(userId, tag.workspaceId);
    if (!isMember) {
      logger.warn(`User ${userId} tried to get tag ${tagId} without workspace access`);
      return res.status(403).json({ error: 'No tienes acceso a esta etiqueta' });
    }

    logger.info(`User ${userId} retrieved tag ${tagId}`);
    res.json(tag);
  } catch (error) {
    logger.error('Error in GET /tags/:id:', error);
    res.status(500).json({ error: 'Error al obtener etiqueta' });
  }
});

// PATCH /tags/:id - Actualizar etiqueta (solo admin del workspace)
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const tagId = req.params.id as string;
    const { name, color } = req.body;
    const userId = (req as any).userId;

    if (color && !/^#[0-9A-F]{6}$/i.test(color)) {
      return res.status(400).json({ error: 'El color debe ser un valor HEX válido' });
    }

    const tag = await prisma.tag.findUnique({ where: { id: tagId } });

    if (!tag) {
      return res.status(404).json({ error: 'Etiqueta no encontrada' });
    }

    // Verificar permisos
    const isAdmin = await isWorkspaceAdmin(userId, tag.workspaceId);
    if (!isAdmin) {
      logger.warn(`User ${userId} tried to update tag ${tagId} without permission`);
      return res.status(403).json({ error: 'Solo administradores pueden actualizar etiquetas' });
    }

    const updatedTag = await prisma.tag.update({
      where: { id: tagId },
      data: {
        ...(name && { name }),
        ...(color && { color })
      }
    });

    await logAudit('UPDATE', 'TAG', tagId, userId, { name, color });
    logger.info(`User ${userId} updated tag ${tagId}`);

    res.json(updatedTag);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Ya existe una etiqueta con este nombre' });
    }
    logger.error('Error in PATCH /tags/:id:', error);
    res.status(500).json({ error: 'Error al actualizar etiqueta' });
  }
});

// DELETE /tags/:id - Eliminar etiqueta (solo admin del workspace)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const tagId = req.params.id as string;
    const userId = (req as any).userId;

    const tag = await prisma.tag.findUnique({ where: { id: tagId } });

    if (!tag) {
      return res.status(404).json({ error: 'Etiqueta no encontrada' });
    }

    // Verificar permisos
    const isAdmin = await isWorkspaceAdmin(userId, tag.workspaceId);
    if (!isAdmin) {
      logger.warn(`User ${userId} tried to delete tag ${tagId} without permission`);
      return res.status(403).json({ error: 'Solo administradores pueden eliminar etiquetas' });
    }

    await prisma.tag.delete({
      where: { id: tagId }
    });

    await logAudit('DELETE', 'TAG', tagId, userId, {});
    logger.info(`User ${userId} deleted tag ${tagId}`);

    res.json({ success: true, message: 'Etiqueta eliminada' });
  } catch (error) {
    logger.error('Error in DELETE /tags/:id:', error);
    res.status(500).json({ error: 'Error al eliminar etiqueta' });
  }
});

export default router;
