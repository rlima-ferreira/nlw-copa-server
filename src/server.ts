import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { PrismaClient } from '@prisma/client';
import Fastify from 'fastify';
import guessRoutes from './routes/guess';
import pollRoutes from './routes/poll';
import userRoutes from './routes/user';

async function bootstrap() {
  const fastify = Fastify({ logger: true });
  const prisma = new PrismaClient({ log: ['query'] });

  await fastify.register(cors, { origin: true });
  await fastify.register(jwt, {
    secret: 'nlwcopa',
  });

  // Rotas
  await fastify.register(pollRoutes);
  await fastify.register(userRoutes);
  await fastify.register(guessRoutes);

  await fastify.listen({ port: 3000, host: '0.0.0.0' });
}

bootstrap();
