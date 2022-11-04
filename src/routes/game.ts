import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import authenticate from '../plugins/authenticate';
import db from '../services/database';

const gameRoutes = async (fastify: FastifyInstance) => {
  fastify.get(
    '/games/polls/:id',
    { onRequest: [authenticate] },
    async (req) => {
      const getGamesParams = z.object({ id: z.string() });
      const { id } = getGamesParams.parse(req.params);
      const games = await db.game.findMany({
        orderBy: { date: 'desc' },
        include: {
          guesses: {
            where: { participant: { userId: req.user.sub, pollId: id } },
          },
        },
      });
      return games.map((game) => ({
        ...game,
        guess: game.guesses.length > 0 ? game.guesses[0] : null,
        guesses: undefined,
      }));
    }
  );
};

export default gameRoutes;
