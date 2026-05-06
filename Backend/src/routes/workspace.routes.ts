import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';

const router = Router();

// GET /workspaces - Obtener todos los espacios de trabajo
router.get('/', async (req: Request, res: Response) => {
  try {
    const workspaces = await prisma.workspace.findMany({
      include: {
        boards: true // Incluimos los tableros de cada workspace para visualización
      }
    });
    res.json(workspaces);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los espacios de trabajo' });
  }
});

// POST /workspaces - Crear un nuevo espacio de trabajo
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      res.status(400).json({ error: 'El nombre del workspace es requerido' });
      return;
    }

    const workspace = await prisma.workspace.create({
      data: {
        name,
        description
      }
    });
    
    res.status(201).json(workspace);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear el espacio de trabajo' });
  }
});

export default router;
