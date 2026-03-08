import type { FastifyInstance } from "fastify";
import { UserController } from "./user.controller.js";

export async function userRoutes(app: FastifyInstance, controller: UserController) {
  app.get("/", controller.getUsers.bind(controller));
  app.get("/:id", controller.getUserById.bind(controller));
  app.post("/", controller.createUser.bind(controller));
}
