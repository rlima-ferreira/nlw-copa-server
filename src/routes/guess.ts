import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import authenticate from '../plugins/authenticate';
import db from '../services/database';

const guessRoutes = async (fastify: FastifyInstance) => {
  fastify.get('/guesses/count', async () => ({
    count: await db.guess.count(),
  }));

  fastify.post(
    '/guesses/polls/:pollId/games/:gameId',
    { onRequest: [authenticate] },
    async (req, res) => {
      const createGuessParams = z.object({
        pollId: z.string(),
        gameId: z.string(),
      });
      const createGuessBody = z.object({
        firstTeamPoints: z.number(),
        secondTeamPoints: z.number(),
      });
      const { pollId, gameId } = createGuessParams.parse(req.params);
      const { firstTeamPoints, secondTeamPoints } = createGuessBody.parse(
        req.body
      );
      const participant = await db.participant.findUnique({
        where: { userId_pollId: { pollId, userId: req.user.sub } },
      });
      if (!participant) {
        return res.status(400).send({
          message: "You're not allowet to create a guess inside this poll.",
        });
      }

      const guess = await db.guess.findUnique({
        where: {
          gameId_participantId: { gameId, participantId: participant.id },
        },
      });
      if (guess) {
        return res.status(400).send({
          message: 'You already sent a guess to this game on this poll.',
        });
      }

      const game = await db.game.findUnique({ where: { id: gameId } });
      if (!game) {
        return res.status(400).send({ message: 'Game not found.' });
      }
      if (game.date < new Date()) {
        return res
          .status(400)
          .send({ message: 'You cannot send guesses after the game date.' });
      }

      await db.guess.create({
        data: {
          firstTeamPoints,
          secondTeamPoints,
          gameId,
          participantId: participant.id,
        },
      });

      return res.status(201).send();
    }
  );
};

export default guessRoutes;
