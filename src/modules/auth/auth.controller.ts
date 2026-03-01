import type { FastifyReply, FastifyRequest } from "fastify";
import type { AuthService } from "./auth.service.js";
import { loginSchema } from "./auth.schema.js";

export class AuthController {
  constructor(private service: AuthService) {}

  async login(request: FastifyRequest, reply: FastifyReply) {
    const { email, password } = loginSchema.parse(request.body);

    const user = await this.service.login(email, password);

    reply.send({ success: true, data: user });
  }
}
