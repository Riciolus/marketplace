import type { FastifyInstance, preHandlerHookHandler } from "fastify";
import type { ProductController } from "./product.controller.js";

export async function productRoutes(
  app: FastifyInstance,
  controller: ProductController,
  authGuard: preHandlerHookHandler
) {
  app.get("/", controller.getProducts.bind(controller));
}
