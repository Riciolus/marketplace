import type { FastifyReply, FastifyRequest } from "fastify";
import { authHeaderSchema } from "../../modules/auth/auth.schema.js";
import { UnauthorizedError } from "../errors/AppError.js";
import { JwtService } from "../../infrastructure/auth/jwt.js";
import type { SessionStore } from "../../infrastructure/redis/redis-session.store.js";

export function createAuthGuard(jwt: JwtService, sessionStore: SessionStore) {
  return async function authGuard(request: FastifyRequest, reply: FastifyReply) {
    try {
      const token = authHeaderSchema.parse(request.headers.authorization);
      const { sub, jti } = jwt.verifyAccessToken(token);

      const exist = await sessionStore.exist(sub, jti);

      if (!exist) {
        throw new UnauthorizedError();
      }

      request.user = { userId: sub, sessionId: jti };
    } catch (error) {
      throw new UnauthorizedError();
    }
  };
}
