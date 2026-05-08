import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';

const router = Router();

// GET /users - Obtener todos los usuarios (con paginación y búsqueda)
router.get('/', async (req: Request, res: Response) => {
  try {
    const skip = parseInt(req.query.skip as string) || 0;
    const take = parseInt(req.query.take as string) || 50;
    const search = req.query.search as string | undefined;
    
    const where = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } }
      ]
    } : {};

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        department: true
      },
      skip,
      take,
      orderBy: { name: 'asc' }
    });

    const total = await prisma.user.count({ where });

    res.json({ users, total, skip, take });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// GET /users/search - Buscar usuarios por nombre o email (búsqueda rápida)
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string' || q.length < 2) {
      return res.status(400).json({ error: 'Query debe tener al menos 2 caracteres' });
    }

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' as const } },
          { email: { contains: q, mode: 'insensitive' as const } }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true
      },
      take: 10
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Error al buscar usuarios' });
  }
});

// GET /users/:id - Obtener usuario por ID (perfil completo)
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        bio: true,
        department: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
});

// PATCH /users/:id - Actualizar perfil de usuario
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { name, bio, department, avatarUrl } = req.body;

    // Validación básica
    if (name && name.length < 2) {
      return res.status(400).json({ error: 'El nombre debe tener al menos 2 caracteres' });
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(bio !== undefined && { bio }),
        ...(department !== undefined && { department }),
        ...(avatarUrl !== undefined && { avatarUrl })
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        bio: true,
        department: true
      }
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});

export default router;
