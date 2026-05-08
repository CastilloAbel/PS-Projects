import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';

const router = Router();

// GET /boards - Obtener todos los tableros con listas y tarjetas
router.get('/', async (req: Request, res: Response) => {
  try {
    const boards = await prisma.board.findMany({
      include: {
        lists: {
          include: {
            cards: {
              include: {
                assignee: {
                  select: {
                    id: true,
                    name: true,
                    avatarUrl: true,
                    email: true
                  }
                },
                tags: {
                  include: {
                    tag: true
                  }
                }
              }
            }
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

// GET /boards/:id - Obtener un tablero específico
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const boardId = req.params.id as string;

    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: {
        workspace: {
          include: {
            tags: true
          }
        },
        lists: {
          include: {
            cards: {
              include: {
                assignee: {
                  select: {
                    id: true,
                    name: true,
                    avatarUrl: true,
                    email: true
                  }
                },
                tags: {
                  include: {
                    tag: true
                  }
                }
              }
            }
          },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!board) {
      return res.status(404).json({ error: 'Tablero no encontrado' });
    }

    res.json(board);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el tablero' });
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

// PATCH /boards/:id - Actualizar tablero
router.patch('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { name, background } = req.body;

    const board = await prisma.board.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(background !== undefined && { background })
      }
    });

    res.json(board);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el tablero' });
  }
});

export default router;
