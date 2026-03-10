import type { FastifyReply, FastifyRequest } from "fastify";
import type { ProductService } from "./product.service.js";
import { productListSchema, productSlugParamSchema } from "./product.schema.js";

export class ProductController {
  constructor(private service: ProductService) {}

  async getProducts(request: FastifyRequest, reply: FastifyReply) {
    const params = productListSchema.parse(request.query);

    const result = await this.service.getProducts(params);

    reply.send({ success: true, ...result });
  }

  async getProductBySlug(request: FastifyRequest, reply: FastifyReply) {
    const { slug } = productSlugParamSchema.parse(request.params);
    request.log.info({ slug });
    const product = await this.service.getProductBySlug(slug);

    reply.send({ success: true, data: product });
  }
}

/*

{
  "id": "...",
  "title": "Nike Airforce 12",
  "slug": "nike-airforce-12",
  "description": "...",
  "seller": {
    "id": "...",
    "name": "Berlin"
  },
  "variants": [
    {
      "id": "...",
      "sku": "NAF-1",
      "price": 1400000,
      "stock": 20,
      "attributes": { "size": "39" }
    }
  ],
  "images": [
    {
      "url": "...",
      "position": 1
    }
  ],
  "categories": [
    {
      "name": "Shoes",
      "slug": "shoes"
    }
  ]
}

*/
