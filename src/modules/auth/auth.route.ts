import type { FastifyInstance, preHandlerHookHandler } from "fastify";
import type { AuthController } from "./auth.controller.js";

export async function authRoutes(
  app: FastifyInstance,
  controller: AuthController,
  authGuard: preHandlerHookHandler
) {
  app.post("/login", controller.login.bind(controller));

  app.post("/refresh", controller.refresh.bind(controller));

  app.post(
    "/logout",
    { preHandler: [authGuard] },
    controller.logout.bind(controller)
  );
}
