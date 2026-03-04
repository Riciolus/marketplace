import type { FastifyInstance } from "fastify";
import type { AuthController } from "./auth.controller.js";

export async function authRoutes(app: FastifyInstance, controller: AuthController) {
  app.post("/login", controller.login.bind(controller));

  app.post("/refresh", controller.refresh.bind(controller));
}
