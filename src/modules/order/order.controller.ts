import type { FastifyReply, FastifyRequest } from "fastify";
import type { OrderService } from "./order.service.js";
import {
  checkoutSchema,
  getOrdersQuerySchema,
  orderIdParamSchema,
  type GetOrdersQuery,
} from "./order.schema.js";

export class OrderController {
  constructor(private service: OrderService) {}

  async checkout(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user.userId;
    const payload = checkoutSchema.parse(request.body);

    const result = await this.service.checkout(userId, payload);

    reply.code(201).send({ status: true, data: result });
  }

  async getOrders(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user.userId;

    const { limit, offset } = getOrdersQuerySchema.parse(request.query);

    const data = await this.service.getOrders(userId, limit, offset);

    reply.send({ status: true, data });
  }

  async getOrderById(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user.userId;
    const { id: orderId } = orderIdParamSchema.parse(request.params);

    const data = await this.service.getOrderById(userId, orderId);

    reply.send({ status: true, data });
  }
}
