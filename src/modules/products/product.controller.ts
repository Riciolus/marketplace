import type { FastifyReply, FastifyRequest } from "fastify";
import type { ProductService } from "./product.service.js";

export class ProductController {
  constructor(private service: ProductService) {}

  async getProducts(request: FastifyRequest, reply: FastifyReply) {
    reply.send({ success: true });
  }
}
