import cors from '@fastify/cors';
import { PrismaClient } from '@prisma/client';
import Fastify from 'fastify';
import ShortUniqueId from 'short-unique-id';
import { z } from 'zod';

async function bootstrap() {
  const fastify = Fastify({ logger: true });
  const prisma = new PrismaClient({ log: ['query'] });

  await fastify.register(cors, { origin: true });

  fastify.get('/pools/count', async () => ({
    count: await prisma.pool.count(),
  }));

  fastify.post('/pools', async (req, res) => {
    const createPoolBody = z.object({ title: z.string() });
    const generate = new ShortUniqueId();
    const data = {
      ...createPoolBody.parse(req.body),
      code: String(generate()).toUpperCase(),
    };
    await prisma.pool.create({ data });
    res.status(201).send({ code: data.code });
  });

  fastify.get('/users/count', async () => ({
    count: await prisma.user.count(),
  }));

  fastify.get('/guesses/count', async () => ({
    count: await prisma.guess.count(),
  }));

  await fastify.listen({ port: 3000, host: '0.0.0.0' });
}

bootstrap();
