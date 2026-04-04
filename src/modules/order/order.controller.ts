import type { FastifyReply, FastifyRequest } from "fastify";
import type { OrderService } from "./order.service.js";
import { checkoutSchema } from "./order.schema.js";

export class OrderController {
  constructor(private service: OrderService) {}

  async checkout(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user.userId;
    const payload = checkoutSchema.parse(request.body);

    const result = await this.service.checkout(userId, payload);

    reply.code(201).send({ status: true, data: result });
  }
}
