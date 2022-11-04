import { FastifyInstance } from 'fastify';
import ShortUniqueId from 'short-unique-id';
import { z } from 'zod';
import authenticate from '../plugins/authenticate';
import db from '../services/database';

const pollRoutes = async (fastify: FastifyInstance) => {
  fastify.get('/polls/count', async () => ({
    count: await db.poll.count(),
  }));

  fastify.get('/polls', { onRequest: [authenticate] }, async (req) => ({
    ...db.poll.findMany({
      where: { participants: { some: { userId: req.user.sub } } },
      include: {
        _count: { select: { participants: true } },
        participants: {
          select: { id: true, user: { select: { avatarUrl: true } } },
          take: 4,
        },
        owner: { select: { id: true, name: true } },
      },
    }),
  }));

  fastify.get('/polls/:id', { onRequest: [authenticate] }, async (req) => {
    const getPollParams = z.object({ id: z.string() });
    const { id } = getPollParams.parse(req.params);
    return await db.poll.findUnique({
      where: { id },
      include: {
        _count: { select: { participants: true } },
        participants: {
          select: { id: true, user: { select: { avatarUrl: true } } },
          take: 4,
        },
        owner: { select: { id: true, name: true } },
      },
    });
  });

  fastify.post('/polls', async (req, res) => {
    const createPollBody = z.object({ title: z.string() });
    const generate = new ShortUniqueId({ length: 6 });
    const data = {
      ...createPollBody.parse(req.body),
      code: String(generate()).toUpperCase(),
    };
    try {
      await req.jwtVerify();
      await db.poll.create({
        data: {
          ...data,
          ownerId: req.user.sub,
          participants: { create: { userId: req.user.sub } },
        },
      });
    } catch {
      await db.poll.create({ data });
    }
    res.status(201).send({ code: data.code });
  });

  fastify.post('/polls/join', { onRequest: authenticate }, async (req, res) => {
    const joinPollBody = z.object({ code: z.string() });
    const { code } = joinPollBody.parse(req.body);
    const poll = await db.poll.findUnique({
      where: { code },
      include: { participants: { where: { userId: req.user.sub } } },
    });
    if (!poll) {
      return res.status(400).send({
        message: 'Poll not found',
      });
    }
    if (poll.participants.length > 0) {
      return res.status(400).send({
        message: 'You already joined this pool.',
      });
    }
    if (!poll.ownerId) {
      await db.poll.update({
        where: { id: poll.id },
        data: { ownerId: req.user.sub },
      });
    }
    await db.participant.create({
      data: { pollId: poll.id, userId: req.user.sub },
    });
    return res.status(201).send();
  });
};

export default pollRoutes;
