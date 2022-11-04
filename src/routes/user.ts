import { FastifyInstance } from 'fastify';
import db from '../services/database';

const userRoutes = async (fastify: FastifyInstance) => {
  fastify.get('/users/count', async () => ({
    count: await db.user.count(),
  }));
};

export default userRoutes;
