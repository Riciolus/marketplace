import type { FastifyInstance } from "fastify";
import { UserController } from "./user.controller.js";

export async function userRoutes(app: FastifyInstance, controller: UserController) {
  app.get("/users", controller.getUsers.bind(controller));
  app.post("/users", controller.createUser.bind(controller));
}
