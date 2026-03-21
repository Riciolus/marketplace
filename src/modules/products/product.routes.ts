import type { FastifyInstance, preHandlerHookHandler } from "fastify";
import type { ProductController } from "./product.controller.js";

export async function productRoutes(
  app: FastifyInstance,
  controller: ProductController,
  authGuard: preHandlerHookHandler
) {
  app.get("/", controller.getProducts.bind(controller));

  app.get("/:slug", controller.getProductBySlug.bind(controller));

  app.post(
    "/",
    { preHandler: [authGuard] },
    controller.createProduct.bind(controller)
  );

  app.patch(
    "/:id",
    { preHandler: [authGuard] },
    controller.updateProduct.bind(controller)
  );

  app.delete(
    "/:id",
    { preHandler: [authGuard] },
    controller.deleteProduct.bind(controller)
  );
}
