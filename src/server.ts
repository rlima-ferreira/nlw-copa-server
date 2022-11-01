import cors from '@fastify/cors';
import { PrismaClient } from '@prisma/client';
import Fastify from 'fastify';

async function bootstrap() {
  const fastify = Fastify({ logger: true });
  const prisma = new PrismaClient({ log: ['query'] });

  await fastify.register(cors, { origin: true });

  fastify.get('/pools/count', async () => ({
    count: await prisma.pool.count(),
  }));

  await fastify.listen({ port: 3000, host: '0.0.0.0' });
}

bootstrap();
