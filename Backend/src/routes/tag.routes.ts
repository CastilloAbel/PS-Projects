import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';

const router = Router();

// POST /tags - Crear una nueva etiqueta
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, color, workspaceId } = req.body;

    if (!name || !color || !workspaceId) {
      return res.status(400).json({ error: 'name, color y workspaceId son requeridos' });
    }

    // Validar formato color HEX
    if (!/^#[0-9A-F]{6}$/i.test(color)) {
      return res.status(400).json({ error: 'El color debe ser un valor HEX válido (ej: #FF5733)' });
    }

    const tag = await prisma.tag.create({
      data: {
        name,
        color,
        workspaceId
      }
    });

    res.status(201).json(tag);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Ya existe una etiqueta con este nombre en el workspace' });
    }
    res.status(500).json({ error: 'Error al crear etiqueta' });
  }
});

// GET /tags - Obtener todas las etiquetas de un workspace
router.get('/', async (req: Request, res: Response) => {
  try {
    const workspaceId = req.query.workspaceId as string;

    if (!workspaceId) {
      return res.status(400).json({ error: 'workspaceId es requerido' });
    }

    const tags = await prisma.tag.findMany({
      where: { workspaceId },
      orderBy: { name: 'asc' }
    });

    res.json(tags);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener etiquetas' });
  }
});

// GET /tags/:id - Obtener etiqueta por ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const tag = await prisma.tag.findUnique({
      where: { id },
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

    res.json(tag);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener etiqueta' });
  }
});

// PATCH /tags/:id - Actualizar etiqueta
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { name, color } = req.body;

    if (color && !/^#[0-9A-F]{6}$/i.test(color)) {
      return res.status(400).json({ error: 'El color debe ser un valor HEX válido' });
    }

    const tag = await prisma.tag.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(color && { color })
      }
    });

    res.json(tag);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Ya existe una etiqueta con este nombre' });
    }
    res.status(500).json({ error: 'Error al actualizar etiqueta' });
  }
});

// DELETE /tags/:id - Eliminar etiqueta
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    await prisma.tag.delete({
      where: { id }
    });

    res.json({ success: true, message: 'Etiqueta eliminada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar etiqueta' });
  }
});

export default router;
