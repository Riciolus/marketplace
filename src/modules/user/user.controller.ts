import type { FastifyReply, FastifyRequest } from "fastify";
import type { UserService } from "./user.service.js";
import { createUserSchema } from "./user.schema.js";

export class UserController {
  constructor(private service: UserService) {}

  async getUsers(request: FastifyRequest, reply: FastifyReply) {
    const users = await this.service.getUsers();

    reply.send({ success: true, data: users });
  }

  async createUser(request: FastifyRequest, reply: FastifyReply) {
    const userReq = createUserSchema.parse(request.body);

    const user = await this.service.createUser(userReq);

    reply.status(201).send({ success: true, data: user });
  }
}
