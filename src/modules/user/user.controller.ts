import type { FastifyReply, FastifyRequest } from "fastify";
import type { UserService } from "./user.service.js";
import { createUserSchema, userIdParamSchema } from "./user.schema.js";

export class UserController {
  constructor(private service: UserService) {}

  async getUsers(request: FastifyRequest, reply: FastifyReply) {
    const users = await this.service.getUsers();

    reply.send({ success: true, data: users });
  }

  async getUserById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = userIdParamSchema.parse(request.params);

    const user = await this.service.getUserById(id);

    reply.send({ success: true, data: user });
  }

  async createUser(request: FastifyRequest, reply: FastifyReply) {
    const { email, password } = createUserSchema.parse(request.body);

    const user = await this.service.createUser({ email, password });

    reply.status(201).send({ success: true, data: user });
  }
}
