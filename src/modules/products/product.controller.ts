import type { FastifyReply, FastifyRequest } from "fastify";
import type { ProductService } from "./product.service.js";
import { productListSchema } from "./product.schema.js";

export class ProductController {
  constructor(private service: ProductService) {}

  async getProducts(request: FastifyRequest, reply: FastifyReply) {
    const params = productListSchema.parse(request.query);

    const result = await this.service.getProducts(params);

    reply.send({ success: true, ...result });
  }
}
