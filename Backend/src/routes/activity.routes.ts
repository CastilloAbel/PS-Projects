import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';

const router = Router();

// GET /activities - Obtener historial de actividad de una tarjeta
router.get('/', async (req: Request, res: Response) => {
  try {
    const cardId = req.query.cardId as string;
    const limit = parseInt(req.query.limit as string) || 50;

    if (!cardId) {
      return res.status(400).json({ error: 'cardId es requerido' });
    }

    const activities = await prisma.activity.findMany({
      where: { cardId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener actividad' });
  }
});

// GET /activities/:id - Obtener actividad específica
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const activity = await prisma.activity.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        },
        card: true
      }
    });

    if (!activity) {
      return res.status(404).json({ error: 'Actividad no encontrada' });
    }

    res.json(activity);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener actividad' });
  }
});

export default router;
