import { FastifyRequest } from 'fastify';

export default async function authenticate(req: FastifyRequest) {
  await req.jwtVerify();
}
