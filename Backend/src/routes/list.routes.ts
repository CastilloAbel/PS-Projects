import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';

const router = Router();

// POST /lists - Crear una nueva columna en un tablero
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, boardId, order } = req.body;

    if (!name || !boardId || order === undefined) {
      res.status(400).json({ error: 'Nombre, boardId y order son requeridos' });
      return;
    }

    const boardExists = await prisma.board.findUnique({
      where: { id: boardId }
    });

    if (!boardExists) {
      res.status(404).json({ error: 'El Tablero proporcionado no existe' });
      return;
    }

    const list = await prisma.list.create({
      data: {
        name,
        order,
        boardId
      }
    });

    res.status(201).json(list);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear la columna (lista)' });
  }
});

export default router;
