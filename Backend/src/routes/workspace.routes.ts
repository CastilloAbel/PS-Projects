import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import { WorkspaceRole } from '@prisma/client';
import logger from '../logger';
import { logAudit } from '../authorization';

const router = Router();

// GET /workspaces - Obtener todos los espacios de trabajo del usuario
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    // Solo obtener workspaces donde el usuario es miembro
    const workspaces = await prisma.workspace.findMany({
      where: {
        members: {
          some: {
            userId
          }
        }
      },
      include: {
        boards: true,
        members: {
          where: { userId },
          select: { role: true }
        }
      }
    });

    logger.info(`User ${userId} retrieved ${workspaces.length} workspaces`);
    res.json(workspaces);
  } catch (error) {
    logger.error('Error in GET /workspaces:', error);
    res.status(500).json({ error: 'Error al obtener los espacios de trabajo' });
  }
});

// GET /workspaces/:id - Obtener workspace específico
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const workspaceId = req.params.id as string;
    const userId = (req as any).userId;

    // Verificar acceso
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

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        boards: true,
        members: true
      }
    });

    if (!workspace) {
      res.status(404).json({ error: 'Workspace no encontrado' });
      return;
    }

    logger.info(`User ${userId} retrieved workspace ${workspaceId}`);
    res.json(workspace);
  } catch (error) {
    logger.error('Error in GET /workspaces/:id:', error);
    res.status(500).json({ error: 'Error al obtener el workspace' });
  }
});

// POST /workspaces - Crear un nuevo espacio de trabajo
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body;
    const userId = (req as any).userId;
    
    if (!name) {
      res.status(400).json({ error: 'El nombre del workspace es requerido' });
      return;
    }

    // Crear workspace y agregar al usuario como OWNER
    const workspace = await prisma.workspace.create({
      data: {
        name,
        description,
        members: {
          create: {
            userId,
            role: WorkspaceRole.OWNER
          }
        }
      },
      include: {
        boards: true,
        members: {
          select: { role: true }
        }
      }
    });

    await logAudit('CREATE', 'WORKSPACE', workspace.id, userId, { name, description });
    logger.info(`User ${userId} created workspace ${workspace.id}`);
    
    res.status(201).json(workspace);
  } catch (error) {
    logger.error('Error in POST /workspaces:', error);
    res.status(500).json({ error: 'Error al crear el espacio de trabajo' });
  }
});

// PATCH /workspaces/:id - Actualizar workspace (solo admin/owner)
router.patch('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const workspaceId = req.params.id as string;
    const userId = (req as any).userId;
    const { name, description } = req.body;

    // Verificar que es admin o owner
    const member = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: { userId, workspaceId }
      }
    });

    if (!member || (member.role !== WorkspaceRole.OWNER && member.role !== WorkspaceRole.ADMIN)) {
      logger.warn(`User ${userId} tried to update workspace ${workspaceId} without permission`);
      res.status(403).json({ error: 'Solo administradores pueden actualizar el workspace' });
      return;
    }

    const workspace = await prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description })
      }
    });

    await logAudit('UPDATE', 'WORKSPACE', workspaceId, userId, { name, description });
    logger.info(`User ${userId} updated workspace ${workspaceId}`);

    res.json(workspace);
  } catch (error) {
    logger.error('Error in PATCH /workspaces/:id:', error);
    res.status(500).json({ error: 'Error al actualizar el workspace' });
  }
});

// DELETE /workspaces/:id - Eliminar workspace (solo owner)
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const workspaceId = req.params.id as string;
    const userId = (req as any).userId;

    // Verificar que es owner
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: {
          where: { userId }
        }
      }
    });

    if (!workspace || workspace.members[0]?.role !== WorkspaceRole.OWNER) {
      logger.warn(`User ${userId} tried to delete workspace ${workspaceId} without permission`);
      res.status(403).json({ error: 'Solo el propietario puede eliminar el workspace' });
      return;
    }

    await prisma.workspace.delete({
      where: { id: workspaceId }
    });

    await logAudit('DELETE', 'WORKSPACE', workspaceId, userId, {});
    logger.info(`User ${userId} deleted workspace ${workspaceId}`);

    res.status(204).send();
  } catch (error) {
    logger.error('Error in DELETE /workspaces/:id:', error);
    res.status(500).json({ error: 'Error al eliminar el workspace' });
  }
});

export default router;
