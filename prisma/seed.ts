import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();

  const user = await prisma.user.create({
    data: {
      name: 'Jonh Doe',
      email: 'jonh.doe@gmail.com',
      avatarUrl: null,
    },
  });

  const pool = await prisma.pool.create({
    data: {
      title: 'Pool 1',
      code: 'PO001',
      ownerId: user.id,
      participants: { create: { userId: user.id } },
    },
  });

  await prisma.game.create({
    data: {
      date: '2022-11-23T12:00:00.201Z',
      firstTeamCountryCode: 'DE',
      secondTeamCountryCode: 'BR',
    },
  });

  await prisma.game.create({
    data: {
      date: '2022-11-25T12:00:00.201Z',
      firstTeamCountryCode: 'AR',
      secondTeamCountryCode: 'BR',
      guesses: {
        create: {
          firstTeamPoints: 2,
          secondTeamPoints: 1,
          participant: {
            connect: { userId_poolId: { userId: user.id, poolId: pool.id } },
          },
        },
      },
    },
  });
}

main();
