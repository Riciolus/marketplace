import type { FastifyInstance, preHandlerHookHandler } from "fastify";
import type { OrderController } from "./order.controller.js";

export async function orderRoutes(
  app: FastifyInstance,
  controller: OrderController,
  authGuard: preHandlerHookHandler
) {
  app.get("/", { preHandler: [authGuard] }, controller.getOrders.bind(controller));

  app.get(
    "/:id",
    { preHandler: [authGuard] },
    controller.getOrderById.bind(controller)
  );

  app.post(
    "/checkout",
    { preHandler: [authGuard] },
    controller.checkout.bind(controller)
  );

  app.patch(
    "/:id/pay",
    { preHandler: [authGuard] },
    controller.payOrder.bind(controller)
  );
}
