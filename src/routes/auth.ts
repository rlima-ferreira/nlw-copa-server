import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import authenticate from '../plugins/authenticate';
import db from '../services/database';

const authRoutes = async (fastify: FastifyInstance) => {
  fastify.get('/me', { onRequest: authenticate }, async (req) => {
    return { user: req.user };
  });

  fastify.post('/users', async (req) => {
    const createUserBody = z.object({ access_token: z.string() });
    const { access_token } = {
      ...createUserBody.parse(req.body),
    };
    const userResponse = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: {
          authorization: `Bearer ${access_token}`,
        },
      }
    );
    const userData = await userResponse.json();
    const userInfoSchema = z.object({
      id: z.string(),
      email: z.string().email(),
      name: z.string(),
      picture: z.string().url(),
    });
    const userInfo = userInfoSchema.parse(userData);
    const user = await db.user.upsert({
      where: { googleId: userInfo.id },
      create: {
        ...userInfo,
        id: undefined,
        googleId: userInfo.id,
        avatarUrl: userInfo.picture,
      },
      update: {
        ...userInfo,
        avatarUrl: userInfo.picture,
      },
    });

    const token = fastify.jwt.sign(
      {
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
      {
        sub: user.id,
        expiresIn: '7 days',
      }
    );

    return { token };
  });
};

export default authRoutes;
