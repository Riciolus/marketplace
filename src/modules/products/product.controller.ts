import type { FastifyReply, FastifyRequest } from "fastify";
import type { ProductService } from "./product.service.js";
import {
  createProductSchema,
  productListSchema,
  productSlugParamSchema,
} from "./product.schema.js";

export class ProductController {
  constructor(private service: ProductService) {}

  async getProducts(request: FastifyRequest, reply: FastifyReply) {
    const params = productListSchema.parse(request.query);

    const result = await this.service.getProducts(params);

    reply.send({ success: true, ...result });
  }

  async getProductBySlug(request: FastifyRequest, reply: FastifyReply) {
    const { slug } = productSlugParamSchema.parse(request.params);

    const product = await this.service.getProductBySlug(slug);

    reply.send({ success: true, data: product });
  }

  async createProduct(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user.userId;

    const payload = createProductSchema.parse(request.body);

    const created = await this.service.createProduct(userId, payload);

    reply.send({ success: true, data: created });
  }
}
