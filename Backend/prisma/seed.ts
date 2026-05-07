import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user1 = await prisma.user.upsert({
    where: { email: 'abel@example.com' },
    update: {},
    create: {
      id: 'user-1',
      email: 'abel@example.com',
      password: 'hashed-password-here', // En un entorno real esto iría hasheado con bcrypt
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
      password: 'hashed-password-here',
      name: 'Dummy',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dummy'
    },
  });

  console.log('Seed terminado: Usuarios creados.', { user1, user2 });
}

main()
  .catch((e) => {
    console.error(e);
    ;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
