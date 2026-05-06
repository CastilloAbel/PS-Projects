import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';

const router = Router();

// POST /cards - Crear una nueva tarjeta en una lista
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, listId, order } = req.body;

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
        listId
      }
    });

    res.status(201).json(card);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear la tarjeta' });
  }
});

// PATCH /cards/:id/move - Mover una tarjeta de lista o reordenar
router.patch('/:id/move', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { listId, order } = req.body;

    if (!listId || order === undefined) {
      res.status(400).json({ error: 'listId y order son requeridos para mover' });
      return;
    }

    const card = await prisma.card.update({
      where: { id },
      data: {
        listId,
        order
      }
    });

    // TODO: En el futuro aquí emitiremos un evento por WebSockets para actualizar a todos los clientes

    res.json(card);
  } catch (error) {
    res.status(500).json({ error: 'Error al mover la tarjeta' });
  }
});

export default router;
