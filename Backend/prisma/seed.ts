import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Hash the default admin password
  const adminPasswordHash = await bcrypt.hash('ps-project-admin', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@ps-project.local' },
    update: {},
    create: {
      id: 'admin-user',
      email: 'admin@ps-project.local',
      password: adminPasswordHash,
      name: 'Administrator',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Administrator'
    },
  });

  const user1 = await prisma.user.upsert({
    where: { email: 'abel@example.com' },
    update: {},
    create: {
      id: 'user-1',
      email: 'abel@example.com',
      password: await bcrypt.hash('password123', 10),
      name: 'Abel',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Abel'
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'dummy@example.com' },
    update: {},
    create: {
      id: 'user-2',
      email: 'dummy@example.com',
      password: await bcrypt.hash('password123', 10),
      name: 'Dummy',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dummy'
    },
  });

  // Create demo workspace for admin
  const workspace = await prisma.workspace.upsert({
    where: { id: 'workspace-demo' },
    update: {},
    create: {
      id: 'workspace-demo',
      name: 'Proyecto Kanban Demo',
      description: 'Espacio de trabajo demostrativo para Pirate Ship',
      members: {
        create: [
          { userId: admin.id, role: 'OWNER' },
          { userId: user1.id, role: 'ADMIN' }
        ]
      }
    },
  });

  // Create demo board in workspace
  const board = await prisma.board.upsert({
    where: { id: 'board-demo' },
    update: {},
    create: {
      id: 'board-demo',
      name: 'Mi Primer Proyecto',
      workspaceId: workspace.id,
      ownerId: admin.id,
      members: {
        create: [
          { userId: admin.id, role: 'OWNER' },
          { userId: user1.id, role: 'ADMIN' }
        ]
      },
      lists: {
        create: [
          {
            id: 'list-todo',
            name: 'Por Hacer',
            order: 0,
            cards: {
              create: [
                {
                  id: 'card-1',
                  title: 'Diseñar interfaz',
                  description: 'Crear mockups de la UI principal',
                  order: 0,
                  assigneeId: admin.id
                },
                {
                  id: 'card-2',
                  title: 'Configurar backend',
                  description: 'Establecer la API REST',
                  order: 1,
                  assigneeId: user1.id
                }
              ]
            }
          },
          {
            id: 'list-doing',
            name: 'En Progreso',
            order: 1,
            cards: {
              create: [
                {
                  id: 'card-3',
                  title: 'Implementar autenticación',
                  description: 'JWT + OAuth2 con Google',
                  order: 0,
                  assigneeId: admin.id
                }
              ]
            }
          },
          {
            id: 'list-done',
            name: 'Hecho',
            order: 2,
            cards: {
              create: [
                {
                  id: 'card-4',
                  title: 'Inicializar base de datos',
                  description: 'PostgreSQL con Prisma ORM',
                  order: 0,
                  assigneeId: admin.id
                }
              ]
            }
          }
        ]
      }
    },
  });

  console.log('Seed completado:', { admin, user1, user2, workspace, board });
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

