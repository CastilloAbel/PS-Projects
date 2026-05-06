import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';

const router = Router();

// GET /boards - Obtener todos los tableros
router.get('/', async (req: Request, res: Response) => {
  try {
    const boards = await prisma.board.findMany({
      include: {
        lists: {
          include: {
            cards: true
          },
          orderBy: { order: 'asc' }
        }
      }
    });
    res.json(boards);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los tableros' });
  }
});

// POST /boards - Crear un nuevo tablero
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, background, workspaceId } = req.body;

    if (!name || !workspaceId) {
      res.status(400).json({ error: 'El nombre y workspaceId son requeridos' });
      return;
    }

    // Verificar si el workspace existe
    const workspaceExists = await prisma.workspace.findUnique({
      where: { id: workspaceId }
    });

    if (!workspaceExists) {
      res.status(404).json({ error: 'El Workspace proporcionado no existe' });
      return;
    }

    const board = await prisma.board.create({
      data: {
        name,
        background,
        workspaceId
      }
    });

    res.status(201).json(board);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear el tablero' });
  }
});

export default router;
