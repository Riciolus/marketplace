// src/container.ts

import { PoolExecutor } from "../infrastructure/database/executor.js";
import { UserController } from "../modules/user/user.controller.js";
import { UserRepository } from "../modules/user/user.repository.js";
import { UserService } from "../modules/user/user.service.js";

export function buildContainer() {
  const executor = new PoolExecutor();

  const userRepository = new UserRepository(executor);
  const userService = new UserService(userRepository);
  const userController = new UserController(userService);

  return {
    userController,
  };
}
