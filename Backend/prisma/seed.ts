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

  console.log('Seed completado:', { admin, user1, user2 });
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

